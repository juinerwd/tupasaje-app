import * as authService from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { LoginCredentials, User } from '@/types';
import { clearTokens } from '@/utils/secureStorage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

/**
 * Hook for user login
 */
export function useLogin() {
    const { login: loginStore } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            const response = await authService.login(credentials);
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Error al iniciar sesión');
            }
            return response.data;
        },
        onSuccess: async (data) => {
            const { user, tokens } = data;
            await loginStore(user, tokens);

            // Invalidate and refetch user profile
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
        onError: (error: any) => {
            console.error('Login error:', error);
        },
        retry: false, // Disable automatic retries
    });
}

/**
 * Hook for user logout
 */
export function useLogout() {
    const { logout: logoutStore } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (options?: { silent?: boolean; reason?: 'manual' | 'inactivity' }) => {
            try {
                await authService.logout();
            } catch (error) {
                // Continue with logout even if API call fails
                // Only log if not silent mode
                if (!options?.silent) {
                    console.error('Logout API error:', error);
                }
            }
        },
        onSuccess: async (_data, variables) => {
            await logoutStore(variables?.reason);

            // Clear all queries
            queryClient.clear();
        },
        onError: async (error: any, variables) => {
            console.error('Logout error:', error);

            // Force logout even on error
            await logoutStore(variables?.reason);
            queryClient.clear();
        },
    });
}

/**
 * Hook to fetch user profile
 */
export function useProfile() {
    const { setUser, isAuthenticated } = useAuthStore();

    const query = useQuery<User | undefined>({
        queryKey: ['user', 'profile'],
        queryFn: async () => {
            // Use userService for profile fetching
            const { getProfile } = await import('@/services/userService');
            const user = await getProfile();
            return user;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Update user in store when data changes
    React.useEffect(() => {
        if (query.data) {
            setUser(query.data);
        }
    }, [query.data, setUser]);

    // Handle errors
    React.useEffect(() => {
        if (query.error) {
            console.error('Profile fetch error:', query.error);

            // If unauthorized, clear tokens
            const error = query.error as any;
            if (error.response?.status === 401) {
                clearTokens().then(() => setUser(null));
            }
        }
    }, [query.error, setUser]);

    return query;
}

/**
 * Combined auth hook
 */
export function useAuth() {
    const authStore = useAuthStore();
    const loginMutation = useLogin();
    const logoutMutation = useLogout();
    const profileQuery = useProfile();

    return {
        // State
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated,
        isLoading: authStore.isLoading || profileQuery.isLoading,

        // Mutations
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        logout: logoutMutation.mutate,
        logoutAsync: logoutMutation.mutateAsync,

        // Mutation states
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        loginError: loginMutation.error,
        logoutError: logoutMutation.error,

        // Profile
        profile: profileQuery.data,
        profileError: profileQuery.error,
        refetchProfile: profileQuery.refetch,
    };
}
