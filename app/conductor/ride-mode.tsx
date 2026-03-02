import { config } from '@/constants/config';
import { BrandColors } from '@/constants/theme';
import { useRideEvents, useRidesSocket } from '@/hooks/useRides';
import { ridesSocketService } from '@/lib/ridesSocket';
import { calculateETA, formatETA } from '@/utils/geo';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = config.apiBaseUrl;

async function getAuthToken() {
    return SecureStore.getItemAsync('access_token');
}

async function apiPost(endpoint: string, body: any) {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    return res.json();
}

type DriverScreenState =
    | 'LOADING'
    | 'INACTIVE'             // Not in ride mode
    | 'ACTIVE_IDLE'          // Available, waiting for requests
    | 'INCOMING_REQUEST'     // Received a ride request
    | 'RIDE_ACCEPTED'        // Accepted, going to pick up passenger
    | 'RIDE_IN_PROGRESS'     // Riding with passenger
    | 'RIDE_COMPLETED'       // Ride finished, rate passenger
    ;

type IncomingRequest = {
    rideId: string;
    passenger?: {
        id: number;
        fullName: string;
        avatar: string | null;
        phoneNumber: string;
    };
    pickupAddress?: string;
    pickupZone?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffAddress?: string;
    dropoffZone?: string;
    estimatedFare?: number;
    paymentMethod?: string;
};

export default function RideModeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    // State
    const [screenState, setScreenState] = useState<DriverScreenState>('LOADING');
    const [isAvailable, setIsAvailable] = useState(false);
    const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(null);
    const [currentRideId, setCurrentRideId] = useState<string | null>(null);
    const [currentPassenger, setCurrentPassenger] = useState<any>(null);
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [cargoSurcharge, setCargoSurcharge] = useState('');
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [rideFare, setRideFare] = useState<number | null>(null);

    // Hooks
    const { isConnected } = useRidesSocket();
    const { rideStatus, rideData, error: rideError, clearError, resetStatus } = useRideEvents();

    // Get location
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para el modo taxi.');
                setScreenState('INACTIVE');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            setScreenState('INACTIVE');
        })();

        return () => {
            locationSubscription.current?.remove();
        };
    }, []);

    // Listen for incoming ride requests via WebSocket
    useEffect(() => {
        const unsubscribe = ridesSocketService.on('ride:incoming_request', (data: IncomingRequest) => {
            setIncomingRequest(data);
            setScreenState('INCOMING_REQUEST');
            // Vibrate to alert driver
            if (Platform.OS !== 'web') {
                Vibration.vibrate([0, 500, 200, 500]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle ride events from WebSocket
    useEffect(() => {
        if (rideStatus === 'CANCELLED') {
            Alert.alert('Viaje cancelado', rideData?.reason || 'El pasajero canceló la solicitud.');
            setScreenState(isAvailable ? 'ACTIVE_IDLE' : 'INACTIVE');
            setCurrentRideId(null);
            setCurrentPassenger(null);
            setIncomingRequest(null);
            resetStatus();
        }
    }, [rideStatus]);

    useEffect(() => {
        if (rideError) {
            Alert.alert('Error', rideError);
            clearError();
        }
    }, [rideError]);

    // Start/stop location tracking when availability changes
    const startLocationTracking = useCallback(async () => {
        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                distanceInterval: 20, // Update every 20 meters
                timeInterval: 5000,   // Or every 5 seconds
            },
            (location) => {
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(coords);
                ridesSocketService.updateLocation(coords.latitude, coords.longitude);
            },
        );
    }, []);

    const stopLocationTracking = useCallback(() => {
        locationSubscription.current?.remove();
        locationSubscription.current = null;
    }, []);

    // Toggle availability — wait for backend confirmation before updating UI
    const toggleAvailability = useCallback(async (value: boolean) => {
        if (isTogglingAvailability) return;
        setIsTogglingAvailability(true);

        try {
            // Create a promise that resolves on success or rejects on error
            const result = await new Promise<boolean>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    cleanupListeners();
                    reject(new Error('Tiempo de espera agotado. Intenta de nuevo.'));
                }, 10000);

                const onSuccess = () => {
                    clearTimeout(timeout);
                    cleanupListeners();
                    resolve(true);
                };

                const onError = (data: { message: string }) => {
                    clearTimeout(timeout);
                    cleanupListeners();
                    reject(new Error(data.message));
                };

                const unsubSuccess = ridesSocketService.on('driver:availability_updated', onSuccess);
                const unsubError = ridesSocketService.on('error', onError);

                const cleanupListeners = () => {
                    unsubSuccess();
                    unsubError();
                };

                // Send the toggle request
                ridesSocketService.toggleAvailability(value, 'Popayán');
            });

            // Backend confirmed — now update UI
            setIsAvailable(value);
            if (value) {
                await startLocationTracking();
                setScreenState('ACTIVE_IDLE');
            } else {
                stopLocationTracking();
                setScreenState('INACTIVE');
            }
        } catch (error: any) {
            // Backend rejected — DON'T change the switch
            Alert.alert('No se puede activar', error.message || 'Error al cambiar disponibilidad');
        } finally {
            setIsTogglingAvailability(false);
        }
    }, [startLocationTracking, stopLocationTracking, isTogglingAvailability]);

    // Accept ride
    const handleAcceptRide = useCallback(() => {
        if (!incomingRequest) return;

        ridesSocketService.acceptRide(incomingRequest.rideId);
        setCurrentRideId(incomingRequest.rideId);
        setCurrentPassenger(incomingRequest.passenger);
        setRideFare(incomingRequest.estimatedFare ? Number(incomingRequest.estimatedFare) : null);
        // Store pickup coordinates for ETA calculation
        if (incomingRequest.pickupLat && incomingRequest.pickupLng) {
            setPickupCoords({ lat: incomingRequest.pickupLat, lng: incomingRequest.pickupLng });
        }
        setScreenState('RIDE_ACCEPTED');
        setIncomingRequest(null);
    }, [incomingRequest]);

    // Reject ride
    const handleRejectRide = useCallback(() => {
        if (!incomingRequest) return;

        ridesSocketService.rejectRide(incomingRequest.rideId);
        setIncomingRequest(null);
        setScreenState('ACTIVE_IDLE');
    }, [incomingRequest]);

    // Start ride (passenger is on board)
    const handleStartRide = useCallback(() => {
        if (!currentRideId) return;
        ridesSocketService.startRide(currentRideId);
        setScreenState('RIDE_IN_PROGRESS');
    }, [currentRideId]);

    // Complete ride
    const handleCompleteRide = useCallback(() => {
        if (!currentRideId) return;

        const surcharge = cargoSurcharge ? parseFloat(cargoSurcharge) : 0;
        ridesSocketService.completeRide(currentRideId, surcharge);
        setScreenState('RIDE_COMPLETED');
    }, [currentRideId, cargoSurcharge]);

    // Rate passenger
    const handleRate = useCallback(async () => {
        if (!currentRideId || rating === 0) return;

        try {
            await apiPost(`/rides/${currentRideId}/rate`, {
                rideId: currentRideId,
                rating,
                comment: ratingComment || undefined,
            });

            Alert.alert('¡Listo!', 'Valoración registrada.');
        } catch { }

        // Reset to idle
        setScreenState(isAvailable ? 'ACTIVE_IDLE' : 'INACTIVE');
        setCurrentRideId(null);
        setCurrentPassenger(null);
        setPickupCoords(null);
        setRating(0);
        setRatingComment('');
        setCargoSurcharge('');
        setRideFare(null);
        resetStatus();
    }, [currentRideId, rating, ratingComment, isAvailable]);

    // ETA calculation — updates in real-time as driver moves
    const etaInfo = useMemo(() => {
        if (!userLocation || !pickupCoords || screenState !== 'RIDE_ACCEPTED') return null;
        return calculateETA(
            userLocation.latitude,
            userLocation.longitude,
            pickupCoords.lat,
            pickupCoords.lng,
        );
    }, [userLocation, pickupCoords, screenState]);

    // Loading
    if (screenState === 'LOADING' || !userLocation) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={BrandColors.primary} />
                <Text style={styles.loadingText}>Preparando modo taxi...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
                showsUserLocation
                showsMyLocationButton={false}
                followsUserLocation={isAvailable}
            />

            {/* Header */}
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[800]} />
                </TouchableOpacity>

                <View style={[styles.statusPill, isAvailable ? styles.statusActive : styles.statusInactive]}>
                    <View style={[styles.statusDot, isAvailable ? styles.dotActive : styles.dotInactive]} />
                    <Text style={styles.statusPillText}>
                        {isAvailable ? 'Disponible' : 'No disponible'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.locationBtn}
                    onPress={() => {
                        mapRef.current?.animateToRegion({
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.015,
                        }, 500);
                    }}
                >
                    <Ionicons name="locate" size={22} color={BrandColors.primary} />
                </TouchableOpacity>
            </View>

            {/* Connection banner */}
            {!isConnected && (
                <View style={[styles.connectionBanner, { top: insets.top + 65 }]}>
                    <Ionicons name="cloud-offline" size={16} color="#fff" />
                    <Text style={styles.connectionText}>Conectando...</Text>
                </View>
            )}

            {/* Bottom Panel */}
            <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>

                {/* INACTIVE or ACTIVE_IDLE — Toggle */}
                {(screenState === 'INACTIVE' || screenState === 'ACTIVE_IDLE') && (
                    <View>
                        <View style={styles.toggleRow}>
                            <View>
                                <Text style={styles.panelTitle}>🚕 Modo Taxi</Text>
                                <Text style={styles.panelSubtitle}>
                                    {isAvailable
                                        ? 'Esperando solicitudes de pasajeros...'
                                        : 'Activa para recibir solicitudes'}
                                </Text>
                            </View>
                            <Switch
                                value={isAvailable}
                                onValueChange={toggleAvailability}
                                disabled={isTogglingAvailability}
                                trackColor={{ false: BrandColors.gray[300], true: BrandColors.primaryLight }}
                                thumbColor={isAvailable ? BrandColors.primary : BrandColors.gray[100]}
                            />
                        </View>

                        {isTogglingAvailability && (
                            <View style={styles.activeHint}>
                                <ActivityIndicator size="small" color={BrandColors.warning} />
                                <Text style={styles.activeHintText}>
                                    Verificando disponibilidad...
                                </Text>
                            </View>
                        )}

                        {isAvailable && !isTogglingAvailability && (
                            <View style={styles.activeHint}>
                                <ActivityIndicator size="small" color={BrandColors.secondary} />
                                <Text style={styles.activeHintText}>
                                    Tu ubicación se comparte con pasajeros cercanos
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* INCOMING_REQUEST */}
                {screenState === 'INCOMING_REQUEST' && incomingRequest && (
                    <View>
                        <View style={styles.incomingBadge}>
                            <Ionicons name="notifications" size={20} color={BrandColors.warning} />
                            <Text style={styles.incomingTitle}>¡Nueva solicitud!</Text>
                        </View>

                        <View style={styles.passengerRow}>
                            <View style={styles.passengerAvatar}>
                                <Ionicons name="person" size={28} color={BrandColors.primary} />
                            </View>
                            <View style={styles.passengerDetails}>
                                <Text style={styles.passengerName}>
                                    {incomingRequest.passenger?.fullName || 'Pasajero'}
                                </Text>
                                {incomingRequest.passenger?.phoneNumber && (
                                    <Text style={styles.passengerPhone}>
                                        📞 {incomingRequest.passenger.phoneNumber}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.routeInfo}>
                            <View style={styles.routeRow}>
                                <Ionicons name="location" size={16} color={BrandColors.primary} />
                                <Text style={styles.routeText}>
                                    {incomingRequest.pickupZone || incomingRequest.pickupAddress || 'Origen'}
                                </Text>
                            </View>
                            <View style={styles.routeDivider} />
                            <View style={styles.routeRow}>
                                <Ionicons name="flag" size={16} color={BrandColors.error} />
                                <Text style={styles.routeText}>
                                    {incomingRequest.dropoffZone || incomingRequest.dropoffAddress || 'Destino'}
                                </Text>
                            </View>
                        </View>

                        {incomingRequest.estimatedFare && (
                            <View style={styles.fareTag}>
                                <Text style={styles.fareTagLabel}>Tarifa:</Text>
                                <Text style={styles.fareTagAmount}>
                                    ${Number(incomingRequest.estimatedFare).toLocaleString('es-CO')} COP
                                </Text>
                            </View>
                        )}

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectRide}>
                                <Ionicons name="close" size={24} color={BrandColors.error} />
                                <Text style={styles.rejectBtnText}>Rechazar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
                                <Ionicons name="checkmark" size={24} color="#fff" />
                                <Text style={styles.acceptBtnText}>Aceptar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* RIDE_ACCEPTED */}
                {screenState === 'RIDE_ACCEPTED' && (
                    <View>
                        <View style={styles.statusBadgeGreen}>
                            <Ionicons name="checkmark-circle" size={20} color={BrandColors.success} />
                            <Text style={styles.statusBadgeText}>Ve a recoger al pasajero</Text>
                        </View>

                        {/* ETA Badge */}
                        {etaInfo && (
                            <View style={styles.etaBadge}>
                                <Ionicons name="time-outline" size={18} color={BrandColors.info} />
                                <Text style={styles.etaText}>
                                    {formatETA(etaInfo.etaMinutes)} • {etaInfo.distanceKm} km
                                </Text>
                            </View>
                        )}

                        <View style={styles.passengerRow}>
                            <View style={styles.passengerAvatar}>
                                <Ionicons name="person" size={28} color={BrandColors.primary} />
                            </View>
                            <View style={styles.passengerDetails}>
                                <Text style={styles.passengerName}>
                                    {currentPassenger?.fullName || 'Pasajero'}
                                </Text>
                                {currentPassenger?.phoneNumber && (
                                    <Text style={styles.passengerPhone}>
                                        📞 {currentPassenger.phoneNumber}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity style={styles.startRideBtn} onPress={handleStartRide}>
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.startRideBtnText}>Pasajero a bordo — Iniciar viaje</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* RIDE_IN_PROGRESS */}
                {screenState === 'RIDE_IN_PROGRESS' && (
                    <View>
                        <View style={styles.statusBadgeBlue}>
                            <Ionicons name="navigate" size={20} color={BrandColors.info} />
                            <Text style={styles.statusBadgeText}>Viaje en progreso</Text>
                        </View>

                        {rideFare !== null && (
                            <View style={styles.fareTag}>
                                <Text style={styles.fareTagLabel}>Tarifa base:</Text>
                                <Text style={styles.fareTagAmount}>
                                    ${rideFare.toLocaleString('es-CO')} COP
                                </Text>
                            </View>
                        )}

                        <View style={styles.surchargeRow}>
                            <Text style={styles.surchargeLabel}>Recargo equipaje ($):</Text>
                            <TextInput
                                style={styles.surchargeInput}
                                placeholder="0"
                                value={cargoSurcharge}
                                onChangeText={setCargoSurcharge}
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteRide}>
                            <Ionicons name="checkmark-done" size={20} color="#fff" />
                            <Text style={styles.completeBtnText}>Completar viaje</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* RIDE_COMPLETED — Rate passenger */}
                {screenState === 'RIDE_COMPLETED' && (
                    <View>
                        <Text style={styles.rateTitle}>¿Cómo fue el pasajero?</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={star <= rating ? '#f59e0b' : BrandColors.gray[300]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Comentario (opcional)"
                            value={ratingComment}
                            onChangeText={setRatingComment}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.startRideBtn, rating === 0 && styles.disabledBtn]}
                            onPress={handleRate}
                            disabled={rating === 0}
                        >
                            <Text style={styles.startRideBtnText}>Enviar valoración</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={() => {
                                setScreenState(isAvailable ? 'ACTIVE_IDLE' : 'INACTIVE');
                                setCurrentRideId(null);
                                setCurrentPassenger(null);
                                resetStatus();
                            }}
                        >
                            <Text style={styles.skipBtnText}>Omitir</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 16, fontSize: 16, color: BrandColors.gray[600] },
    map: { flex: 1 },

    // Top bar
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    statusActive: { backgroundColor: '#ecfdf5' },
    statusInactive: { backgroundColor: '#fff' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    dotActive: { backgroundColor: BrandColors.success },
    dotInactive: { backgroundColor: BrandColors.gray[400] },
    statusPillText: { fontSize: 13, fontWeight: '600', color: BrandColors.gray[800] },
    locationBtn: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },

    // Connection banner
    connectionBanner: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: BrandColors.warning,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    connectionText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    // Bottom panel
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    panelTitle: { fontSize: 20, fontWeight: '700', color: BrandColors.gray[900] },
    panelSubtitle: { fontSize: 13, color: BrandColors.gray[500], marginTop: 2 },
    activeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        backgroundColor: '#fef9c3',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    activeHintText: { fontSize: 13, color: BrandColors.gray[700], flex: 1 },

    // Incoming request
    incomingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef3c7',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    incomingTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.gray[900] },

    // Passenger info
    passengerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    passengerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    passengerDetails: { flex: 1 },
    passengerName: { fontSize: 17, fontWeight: '700', color: BrandColors.gray[900] },
    passengerPhone: { fontSize: 13, color: BrandColors.primary, marginTop: 3 },

    // Route info
    routeInfo: {
        backgroundColor: BrandColors.gray[50],
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeText: { fontSize: 14, color: BrandColors.gray[700], flex: 1 },
    routeDivider: {
        width: 2,
        height: 16,
        backgroundColor: BrandColors.gray[300],
        marginLeft: 7,
        marginVertical: 4,
    },

    // Fare
    fareTag: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    fareTagLabel: { fontSize: 14, color: BrandColors.gray[700] },
    fareTagAmount: { fontSize: 16, fontWeight: '700', color: BrandColors.gray[900] },

    // Action buttons
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: BrandColors.error,
    },
    rejectBtnText: { color: BrandColors.error, fontSize: 15, fontWeight: '700' },
    acceptBtn: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: BrandColors.primary,
    },
    acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Status badges
    statusBadgeGreen: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ecfdf5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    statusBadgeBlue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    statusBadgeText: { fontSize: 16, fontWeight: '700', color: BrandColors.gray[900] },

    // ETA Badge
    etaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: BrandColors.info + '15',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    etaText: { fontSize: 13, fontWeight: '600', color: BrandColors.info },

    // Start ride
    startRideBtn: {
        backgroundColor: BrandColors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    startRideBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Surcharge
    surchargeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    surchargeLabel: { fontSize: 14, color: BrandColors.gray[700] },
    surchargeInput: {
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        width: 100,
        fontSize: 14,
        textAlign: 'right',
    },

    // Complete
    completeBtn: {
        backgroundColor: BrandColors.success,
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Rating
    rateTitle: { fontSize: 20, fontWeight: '700', color: BrandColors.gray[900], textAlign: 'center', marginBottom: 12 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
    commentInput: {
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 12,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    disabledBtn: { opacity: 0.5 },
    skipBtn: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
    skipBtnText: { color: BrandColors.gray[500], fontSize: 14 },
});
