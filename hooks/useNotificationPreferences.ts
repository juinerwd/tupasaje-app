import * as notificationService from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { NotificationPreferences, UpdateNotificationPreferencesDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<NotificationPreferences>({
        queryKey: ['notifications', 'preferences'],
        queryFn: async () => {
            return await notificationService.getPreferences();
        },
        enabled: isAuthenticated,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateNotificationPreferencesDto) => {
            return await notificationService.updatePreferences(data);
        },
        onMutate: async (newData) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['notifications', 'preferences'] });

            // Snapshot previous value
            const previousPreferences = queryClient.getQueryData<NotificationPreferences>(['notifications', 'preferences']);

            // Optimistically update to the new value
            if (previousPreferences) {
                queryClient.setQueryData(['notifications', 'preferences'], {
                    ...previousPreferences,
                    ...newData,
                });
            }

            return { previousPreferences };
        },
        onSuccess: (data) => {
            // Update with server response
            queryClient.setQueryData(['notifications', 'preferences'], data);
        },
        onError: (error, newData, context) => {
            // Rollback on error
            if (context?.previousPreferences) {
                queryClient.setQueryData(['notifications', 'preferences'], context.previousPreferences);
            }
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
        },
    });
}
