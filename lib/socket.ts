import { config } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

// Strip /api/v1 suffix since Socket.io connects to the root server
const SOCKET_URL = config.apiBaseUrl.replace(/\/api\/v\d+$/, '');

class SocketService {
    private socket: Socket | null = null;
    private listeners: Set<(data: any) => void> = new Set();

    async connect() {
        if (this.socket?.connected) {
            return;
        }

        const token = await SecureStore.getItemAsync('access_token');

        if (!token) {
            return;
        }

        this.socket = io(`${SOCKET_URL}/notifications`, {
            auth: {
                token: token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            // Connected successfully
        });

        this.socket.on('new_notification', (data) => {
            this.listeners.forEach(listener => listener(data));
        });

        this.socket.on('disconnect', (reason) => {
            // Socket disconnected
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onNotification(callback: (data: any) => void) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
