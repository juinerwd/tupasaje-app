import { config } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

// Strip /api/v1 suffix since Socket.io connects to the root server
const SOCKET_URL = config.apiBaseUrl.replace(/\/api\/v\d+$/, '');

export type NearbyDriver = {
    driverId: number;
    fullName: string;
    avatar: string | null;
    vehiclePlate: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleType: string;
    rating: number;
    totalTrips: number;
    latitude: number;
    longitude: number;
};

export type RideInfo = {
    rideId: string;
    status: string;
    passenger?: {
        id: number;
        fullName: string;
        avatar: string | null;
        phoneNumber: string;
    };
    driver?: {
        id: number;
        fullName: string;
        avatar: string | null;
        phoneNumber: string;
        driver?: {
            vehiclePlate: string;
            vehicleModel: string;
            vehicleColor: string;
            vehicleType: string;
            averageRating: number;
        };
    };
    pickupAddress?: string;
    pickupZone?: string;
    dropoffAddress?: string;
    dropoffZone?: string;
    estimatedFare?: number;
    finalFare?: number;
    paymentMethod?: string;
};

type RideEventCallback = (data: any) => void;

class RidesSocketService {
    private socket: Socket | null = null;
    private eventListeners = new Map<string, Set<RideEventCallback>>();

    async connect() {
        if (this.socket?.connected) {
            return;
        }

        const token = await SecureStore.getItemAsync('access_token');
        if (!token) {
            console.warn('RidesSocket: No token available');
            return;
        }

        this.socket = io(`${SOCKET_URL}/rides`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('RidesSocket: Connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('RidesSocket: Disconnected -', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('RidesSocket: Connection error:', error.message);
        });

        this.socket.on('error', (data: { message: string }) => {
            console.error('RidesSocket: Server error:', data.message);
            this.emit('error', data);
        });

        // Register all event forwarding
        const events = [
            'nearby_drivers',
            'driver:availability_updated',
            'ride:request_sent',
            'ride:broadcast_sent',
            'ride:incoming_request',
            'ride:accepted',
            'ride:driver_accepted',
            'ride:driver_rejected',
            'ride:started',
            'ride:completed',
            'ride:cancelled',
            'driver_location_update',
        ];

        events.forEach((event) => {
            this.socket!.on(event, (data: any) => {
                this.emit(event, data);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.eventListeners.clear();
    }

    isConnected() {
        return this.socket?.connected || false;
    }

    // ============================================
    // Driver actions
    // ============================================

    toggleAvailability(available: boolean, cityName?: string) {
        this.socket?.emit('driver:toggle_available', { available, cityName });
    }

    updateLocation(latitude: number, longitude: number) {
        this.socket?.emit('driver:update_location', { latitude, longitude });
    }

    acceptRide(rideId: string) {
        this.socket?.emit('driver:accept_ride', { rideId });
    }

    rejectRide(rideId: string) {
        this.socket?.emit('driver:reject_ride', { rideId });
    }

    startRide(rideId: string) {
        this.socket?.emit('driver:start_ride', { rideId });
    }

    completeRide(rideId: string, cargoSurcharge?: number) {
        this.socket?.emit('driver:complete_ride', { rideId, cargoSurcharge });
    }

    // ============================================
    // Passenger actions
    // ============================================

    getNearbyDrivers(latitude: number, longitude: number, radius?: number) {
        this.socket?.emit('passenger:get_nearby_drivers', { latitude, longitude, radius });
    }

    requestRide(rideId: string, driverId: number) {
        this.socket?.emit('passenger:request_ride', { rideId, driverId });
    }

    cancelRide(rideId: string, reason?: string) {
        this.socket?.emit('passenger:cancel_ride', { rideId, reason });
    }

    broadcastRide(rideId: string) {
        this.socket?.emit('passenger:broadcast_ride', { rideId });
    }

    // ============================================
    // Event management
    // ============================================

    on(event: string, callback: RideEventCallback): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.eventListeners.get(event)?.delete(callback);
        };
    }

    off(event: string, callback: RideEventCallback) {
        this.eventListeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any) {
        this.eventListeners.get(event)?.forEach((cb) => cb(data));
    }
}

export const ridesSocketService = new RidesSocketService();
