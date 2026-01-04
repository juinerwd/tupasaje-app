import * as notificationService from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { NotificationChannel, NotificationsResponse, NotificationStatus, NotificationType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch notifications (Inbox)
 */
export function useNotifications(params?: {
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery<NotificationsResponse>({
        queryKey: ['notifications', 'inbox', params],
        queryFn: async () => {
            return await notificationService.getNotifications(params);
        },
        enabled: isAuthenticated,
    });
}

/**
 * Hook to get unread notifications count
 */
export function useUnreadNotificationsCount() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<{ unreadCount: number }>({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            return await notificationService.getUnreadCount();
        },
        enabled: isAuthenticated,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return await notificationService.markAsRead(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            return await notificationService.markAllAsRead();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });
}
