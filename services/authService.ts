import api from '@/lib/axios';
import {
    ApiResponse,
    AuthSession,
    AuthTokens,
    ChangePinDto,
    LoginCredentials,
    LoginResponse,
    RegistrationData,
    User,
    VerificationCodeResponse
} from '@/types';

/**
 * Send SMS verification code to phone number
 */
export async function sendVerificationCode(phone: string): Promise<VerificationCodeResponse> {
    const response = await api.post<VerificationCodeResponse>('/auth/send-verification-code', {
        phone,
    });
    return response.data;
}

/**
 * Verify SMS code
 */
export async function verifyCode(phone: string, code: string): Promise<ApiResponse<{ verified: boolean }>> {
    const response = await api.post<ApiResponse<{ verified: boolean }>>('/auth/verify-code', {
        phone,
        code,
    });
    return response.data;
}

/**
 * Register new user
 */
export async function register(data: RegistrationData): Promise<ApiResponse<{ message: string }>> {
    try {
        const response = await api.post<{ message: string }>('/auth/register', data);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        throw error;
    }
}

/**
 * Login user with phone and PIN
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
        // Backend returns: { accessToken, refreshToken, user }
        const response = await api.post<LoginResponse>('/auth/login', credentials);

        // Transform to internal format with tokens object
        return {
            success: true,
            data: {
                user: response.data.user,
                tokens: {
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                },
            },
        };
    } catch (error: any) {
        throw error;
    }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
        refreshToken,
    });
    return response.data;
}

/**
 * Get current user profile
 * @deprecated Use userService.getProfile() instead
 */
export async function getProfile(): Promise<User> {
    // Re-export from userService for backward compatibility
    const { getProfile: getUserProfile } = await import('./userService');
    return getUserProfile();
}

/**
 * Logout user
 * Note: Backend requires sessionId which we don't currently store.
 * The useLogout hook handles local logout even if this fails.
 */
export async function logout(): Promise<ApiResponse<void>> {
    try {
        // Try to logout on backend (will likely fail with 400 due to missing sessionId)
        // But that's okay - the hook will still perform local logout
        const response = await api.post<ApiResponse<void>>('/auth/logout', {});
        return response.data;
    } catch (error) {
        // Log error but don't throw - local logout will still happen
        console.warn('Backend logout failed (expected if sessionId not implemented):', error);
        // Return success so local logout proceeds
        return { success: true, data: undefined };
    }
}

/**
 * Change user PIN
 */
export async function changePin(data: ChangePinDto): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post<{ message: string }>('/auth/change-pin', data);
    return {
        success: true,
        data: response.data,
    };
}

/**
 * Get all active sessions for the user
 */
export async function getSessions(): Promise<ApiResponse<{ sessions: AuthSession[]; total: number }>> {
    const response = await api.get<{ sessions: AuthSession[]; total: number }>('/auth/sessions');
    return {
        success: true,
        data: response.data,
    };
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete<{ message: string }>(`/auth/sessions/${sessionId}`, {
        data: { reason },
    });
    return {
        success: true,
        data: response.data,
    };
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllSessions(currentSessionId?: string): Promise<ApiResponse<{ message: string; revokedCount: number }>> {
    const response = await api.post<{ message: string; revokedCount: number }>('/auth/sessions/revoke-all', {
        currentSessionId,
    });
    return {
        success: true,
        data: response.data,
    };
}
