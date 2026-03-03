import { config } from '@/constants/config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/utils/secureStorage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
export const api = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple refresh attempts
export let isRefreshing = false;

let failedQueue: Array<{
    resolve: (value: string | null) => void;
    reject: (reason?: any) => void;
}> = [];


const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor - Add access token to headers
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessToken();

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh on 401
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        // IMPORTANT: Do not attempt to refresh token if the request was to login or refresh itself
        const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && isAuthRequest) {
            // Fail immediately for auth requests, don't even try the queue or refresh
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const accessToken = await refreshTokens();
                if (!accessToken) {
                    return Promise.reject(error);
                }

                // Update authorization header
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Manually trigger a token refresh
 * Useful for sockets or other non-axios connections
 */
export async function refreshTokens(): Promise<string | null> {
    if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }


    isRefreshing = true;

    try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            // No refresh token, clear everything and reject
            await clearTokens();
            processQueue(new Error('No refresh token available') as any, null);
            return null;
        }

        // Call refresh endpoint
        const response = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
            refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Save new tokens
        await saveTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);
        isRefreshing = false;

        return accessToken;
    } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        // Clear tokens on refresh failure
        await clearTokens();

        return null;
    }
}


export default api;
