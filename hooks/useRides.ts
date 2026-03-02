import { NearbyDriver, ridesSocketService } from '@/lib/ridesSocket';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to manage rides socket connection
 */
export function useRidesSocket() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        ridesSocketService.connect().then(() => {
            setIsConnected(ridesSocketService.isConnected());
        });

        const checkInterval = setInterval(() => {
            setIsConnected(ridesSocketService.isConnected());
        }, 3000);

        return () => {
            clearInterval(checkInterval);
        };
    }, []);

    return { isConnected, socket: ridesSocketService };
}

/**
 * Hook for passenger to get nearby drivers with auto-refresh
 */
export function useNearbyDrivers(latitude: number | null, longitude: number | null, refreshIntervalMs = 5000) {
    const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!latitude || !longitude) return;

        const unsubscribe = ridesSocketService.on('nearby_drivers', (data: NearbyDriver[]) => {
            setDrivers(data);
            setLoading(false);
        });

        // Request immediately
        setLoading(true);
        ridesSocketService.getNearbyDrivers(latitude, longitude);

        // Auto-refresh
        const interval = setInterval(() => {
            ridesSocketService.getNearbyDrivers(latitude, longitude);
        }, refreshIntervalMs);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [latitude, longitude, refreshIntervalMs]);

    return { drivers, loading };
}

/**
 * Hook for listening to ride status updates (for both passenger and driver)
 */
export function useRideEvents() {
    const [rideStatus, setRideStatus] = useState<string | null>(null);
    const [rideData, setRideData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribers = [
            ridesSocketService.on('ride:request_sent', (data) => {
                setRideStatus('REQUESTED');
                setRideData(data);
            }),
            ridesSocketService.on('ride:broadcast_sent', (data) => {
                setRideStatus('BROADCAST_SENT');
                setRideData(data);
            }),
            ridesSocketService.on('ride:incoming_request', (data) => {
                setRideStatus('INCOMING_REQUEST');
                setRideData(data);
            }),
            ridesSocketService.on('ride:accepted', (data) => {
                setRideStatus('ACCEPTED');
                setRideData(data);
            }),
            ridesSocketService.on('ride:driver_accepted', (data) => {
                setRideStatus('DRIVER_ACCEPTED');
                setRideData(data);
            }),
            ridesSocketService.on('ride:driver_rejected', (data) => {
                setRideStatus('DRIVER_REJECTED');
                setRideData(data);
            }),
            ridesSocketService.on('ride:started', (data) => {
                setRideStatus('IN_PROGRESS');
                setRideData(data);
            }),
            ridesSocketService.on('ride:completed', (data) => {
                setRideStatus('COMPLETED');
                setRideData(data);
            }),
            ridesSocketService.on('ride:cancelled', (data) => {
                setRideStatus('CANCELLED');
                setRideData(data);
            }),
            ridesSocketService.on('error', (data) => {
                setError(data.message);
            }),
        ];

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, []);

    const clearError = useCallback(() => setError(null), []);
    const resetStatus = useCallback(() => {
        setRideStatus(null);
        setRideData(null);
    }, []);

    return { rideStatus, rideData, error, clearError, resetStatus };
}

/**
 * Hook for tracking driver location in real-time (passenger side)
 */
export function useDriverLocation() {
    const [driverLocation, setDriverLocation] = useState<{
        driverId: number;
        latitude: number;
        longitude: number;
    } | null>(null);

    useEffect(() => {
        const unsubscribe = ridesSocketService.on('driver_location_update', (data) => {
            setDriverLocation(data);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return driverLocation;
}
