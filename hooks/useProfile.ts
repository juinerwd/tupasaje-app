import * as userService from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { UpdateProfileDto, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

/**
 * Hook to fetch user profile
 */
export function useUserProfile() {
    const { setUser, isAuthenticated } = useAuthStore();

    const query = useQuery<User | undefined>({
        queryKey: ['user', 'profile'],
        queryFn: async () => {
            const user = await userService.getProfile();
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

    return query;
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (data: UpdateProfileDto) => {
            const response = await userService.updateProfile(data);
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Error al actualizar el perfil');
            }
            return response.data;
        },
        onMutate: async (newData) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });

            // Snapshot previous value
            const previousUser = queryClient.getQueryData<User>(['user', 'profile']);

            // Optimistically update to the new value
            if (previousUser) {
                const optimisticUser = {
                    ...previousUser,
                    ...newData,
                    // Update fullName if firstName or lastName changed
                    fullName: newData.firstName || newData.lastName
                        ? `${newData.firstName || previousUser.firstName} ${newData.lastName || previousUser.lastName}`
                        : previousUser.fullName,
                };
                queryClient.setQueryData(['user', 'profile'], optimisticUser);
                setUser(optimisticUser);
            }

            return { previousUser };
        },
        onSuccess: (data) => {
            // Update with server response
            queryClient.setQueryData(['user', 'profile'], data);
            setUser(data);

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['user', 'profile', 'completeness'] });
        },
        onError: (error: any, newData, context) => {
            // Rollback on error
            if (context?.previousUser) {
                queryClient.setQueryData(['user', 'profile'], context.previousUser);
                setUser(context.previousUser);
            }
            console.error('Update profile error:', error);
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
}

/**
 * Hook to get profile completeness
 */
export function useProfileCompleteness() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['user', 'profile', 'completeness'],
        queryFn: async () => {
            return await userService.getProfileCompleteness();
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
