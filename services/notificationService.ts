import api from '@/lib/axios';
import {
    NotificationChannel,
    NotificationPreferences,
    NotificationsResponse,
    NotificationStatus,
    NotificationType,
    UpdateNotificationPreferencesDto
} from '@/types';

/**
 * Get notifications with optional filters
 */
export async function getNotifications(params?: {
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
}): Promise<NotificationsResponse> {
    const response = await api.get<NotificationsResponse>('/notifications', { params });
    return response.data;
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get<{ unreadCount: number }>('/notifications/unread');
    return response.data;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<{ id: string; status: string; readAt: string }> {
    const response = await api.patch<{ id: string; status: string; readAt: string }>(
        `/notifications/${id}/read`
    );
    return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ count: number }> {
    const response = await api.patch<{ count: number }>('/notifications/read-all');
    return response.data;
}

/**
 * Get notification preferences
 */
export async function getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
    data: UpdateNotificationPreferencesDto
): Promise<NotificationPreferences> {
    const response = await api.patch<NotificationPreferences>('/notifications/preferences', data);
    return response.data;
}
