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
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();

                if (!refreshToken) {
                    // No refresh token, clear everything and reject
                    await clearTokens();
                    processQueue(error, null);
                    return Promise.reject(error);
                }

                // Call refresh endpoint
                const response = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Save new tokens
                await saveTokens(accessToken, newRefreshToken);

                // Update authorization header
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                processQueue(null, accessToken);
                isRefreshing = false;

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                isRefreshing = false;

                // Clear tokens on refresh failure
                await clearTokens();

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
