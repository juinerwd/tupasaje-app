import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook to manage real-time notification connection via WebSockets
 */
export function useSocketNotifications() {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Conectar al socket
            socketService.connect();

            // Escuchar notificaciones
            const unsubscribe = socketService.onNotification((notification) => {
                // 1. Invalidar queries de React Query para refrescar la UI automáticamente
                queryClient.invalidateQueries({ queryKey: ['notifications', 'inbox'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

                // Si la notificación es de tipo financiero, refrescar el balance
                if (notification.type === 'RECHARGE' || notification.type === 'PAYMENT' || notification.type === 'TRANSFER') {
                    queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
                }

                // 2. Mostrar alerta local (opcional si la app está en primer plano)
                // En el futuro esto se integrará con expo-notifications para banners locales
            });

            return () => {
                unsubscribe();
                socketService.disconnect();
            };
        } else {
            socketService.disconnect();
        }
    }, [isAuthenticated, user, queryClient]);

    return {
        isConnected: socketService.isConnected(),
    };
}
