import { config } from '@/constants/config';
import { BrandColors } from '@/constants/theme';
import { useDriverLocation, useNearbyDrivers, useRideEvents, useRidesSocket } from '@/hooks/useRides';
import { NearbyDriver, ridesSocketService } from '@/lib/ridesSocket';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// API helpers
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

type ScreenState =
    | 'LOADING_LOCATION'
    | 'MAP_BROWSE'           // Browsing map, seeing drivers
    | 'DRIVER_SELECTED'      // Tapped a driver, showing info
    | 'BROADCAST_DEST'       // Entering destination for broadcast request
    | 'WAITING_FOR_DRIVER'   // Request sent, waiting for accept/reject
    | 'DRIVER_ACCEPTED'      // Driver accepted, showing driver info
    | 'IN_PROGRESS'          // Ride in progress
    | 'COMPLETED'            // Ride completed
    | 'RATE_RIDE';           // Rating screen

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RequestRideScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    // State
    const [screenState, setScreenState] = useState<ScreenState>('LOADING_LOCATION');
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);
    const [destination, setDestination] = useState('');
    const [originZone, setOriginZone] = useState('');
    const [destZone, setDestZone] = useState('');
    const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
    const [currentRideId, setCurrentRideId] = useState<string | null>(null);
    const [showDestModal, setShowDestModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [isBroadcast, setIsBroadcast] = useState(false);
    const [driversNotified, setDriversNotified] = useState(0);

    // Determine if there is an active ride (to stop polling and hide markers)
    const isRideActive = screenState === 'WAITING_FOR_DRIVER'
        || screenState === 'DRIVER_ACCEPTED'
        || screenState === 'IN_PROGRESS';

    // Hooks
    const { isConnected } = useRidesSocket();
    const { drivers, loading: driversLoading } = useNearbyDrivers(
        userLocation?.latitude ?? null,
        userLocation?.longitude ?? null,
        5000,
        !isRideActive, // Disable polling when ride is active
    );
    const { rideStatus, rideData, error: rideError, clearError, resetStatus } = useRideEvents();
    const driverLocation = useDriverLocation();

    // Request location permissions and get location
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso de ubicación',
                    'Necesitamos tu ubicación para mostrarte conductores cercanos.',
                    [{ text: 'OK', onPress: () => router.back() }],
                );
                return;
            }

            let coords: { latitude: number; longitude: number } | null = null;

            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
            } catch (e) {
                console.warn('No se pudo obtener la ubicación actual, intentando última conocida...');
                try {
                    const lastKnown = await Location.getLastKnownPositionAsync();
                    if (lastKnown) {
                        coords = {
                            latitude: lastKnown.coords.latitude,
                            longitude: lastKnown.coords.longitude,
                        };
                    }
                } catch { }
            }

            if (!coords) {
                // Default to Popayán center as fallback
                coords = { latitude: 2.4419, longitude: -76.6061 };
                Alert.alert(
                    'Ubicación no disponible',
                    'No se pudo obtener tu ubicación actual. Asegúrate de tener los servicios de ubicación activados. Se usará una ubicación aproximada.',
                );
            }

            setUserLocation(coords);
            setScreenState('MAP_BROWSE');
        })();
    }, []);

    // React to ride events from WebSocket
    useEffect(() => {
        if (rideStatus === 'DRIVER_ACCEPTED') {
            setScreenState('DRIVER_ACCEPTED');
            setIsBroadcast(false);
        } else if (rideStatus === 'BROADCAST_SENT') {
            setScreenState('WAITING_FOR_DRIVER');
            setDriversNotified(rideData?.driversNotified || 0);
        } else if (rideStatus === 'DRIVER_REJECTED') {
            // Only go back to browse if it was a direct request
            if (!isBroadcast) {
                setScreenState('MAP_BROWSE');
                setSelectedDriver(null);
                Alert.alert('Solicitud rechazada', rideData?.message || 'Busca otro conductor.');
            }
            // For broadcast, ignore individual rejections — keep waiting
        } else if (rideStatus === 'IN_PROGRESS') {
            setScreenState('IN_PROGRESS');
        } else if (rideStatus === 'COMPLETED') {
            setScreenState('RATE_RIDE');
        } else if (rideStatus === 'CANCELLED') {
            setScreenState('MAP_BROWSE');
            setSelectedDriver(null);
            setCurrentRideId(null);
            setIsBroadcast(false);
            resetStatus();
        }
    }, [rideStatus]);

    useEffect(() => {
        if (rideError) {
            Alert.alert('Error', rideError);
            clearError();
        }
    }, [rideError]);

    // Handle driver marker tap — blocked during active rides
    const onDriverPress = useCallback((driver: NearbyDriver) => {
        if (isRideActive) return; // Don't allow selecting another driver during active ride
        setSelectedDriver(driver);
        setScreenState('DRIVER_SELECTED');
        mapRef.current?.animateToRegion({
            latitude: driver.latitude,
            longitude: driver.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 500);
    }, [isRideActive]);

    // Request ride
    const handleRequestRide = useCallback(async () => {
        if (!selectedDriver || !userLocation) return;

        if (!destination.trim()) {
            setShowDestModal(true);
            return;
        }

        try {
            // Create ride request via REST
            const ride = await apiPost('/rides/request', {
                pickupLat: userLocation.latitude,
                pickupLng: userLocation.longitude,
                pickupAddress: 'Mi ubicación',
                pickupZone: originZone || undefined,
                dropoffLat: selectedDriver.latitude,
                dropoffLng: selectedDriver.longitude,
                dropoffAddress: destination,
                dropoffZone: destZone || undefined,
                paymentMethod: 'CASH',
                cityName: 'Popayán', // TODO: detect from location
            });

            if (ride.id) {
                setCurrentRideId(ride.id);
                setEstimatedFare(ride.estimatedFare ? Number(ride.estimatedFare) : null);

                // Send to specific driver via WebSocket
                ridesSocketService.requestRide(ride.id, selectedDriver.driverId);
                setScreenState('WAITING_FOR_DRIVER');
            } else {
                Alert.alert('Error', ride.message || 'No se pudo crear la solicitud');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al solicitar taxi');
        }
    }, [selectedDriver, userLocation, destination, originZone, destZone]);

    // Broadcast ride to all drivers
    const handleBroadcastRide = useCallback(async () => {
        if (!userLocation) return;

        if (!destination.trim()) {
            setShowDestModal(true);
            return;
        }

        try {
            // Create ride request via REST (no specific driver)
            const ride = await apiPost('/rides/request', {
                pickupLat: userLocation.latitude,
                pickupLng: userLocation.longitude,
                pickupAddress: 'Mi ubicación',
                pickupZone: originZone || undefined,
                dropoffLat: userLocation.latitude, // Same coords — driver comes to you
                dropoffLng: userLocation.longitude,
                dropoffAddress: destination,
                dropoffZone: destZone || undefined,
                paymentMethod: 'CASH',
                cityName: 'Popayán',
            });

            if (ride.id) {
                setCurrentRideId(ride.id);
                setEstimatedFare(ride.estimatedFare ? Number(ride.estimatedFare) : null);
                setIsBroadcast(true);

                // Broadcast to all available drivers via WebSocket
                ridesSocketService.broadcastRide(ride.id);
                setScreenState('WAITING_FOR_DRIVER');
            } else {
                Alert.alert('Error', ride.message || 'No se pudo crear la solicitud');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al solicitar taxi');
        }
    }, [userLocation, destination, originZone, destZone]);

    // Cancel ride
    const handleCancel = useCallback(() => {
        if (currentRideId) {
            ridesSocketService.cancelRide(currentRideId, 'Cancelado por pasajero');
        }
        setScreenState('MAP_BROWSE');
        setSelectedDriver(null);
        setCurrentRideId(null);
        setIsBroadcast(false);
        resetStatus();
    }, [currentRideId]);

    // Submit rating
    const handleRate = useCallback(async () => {
        if (!currentRideId || rating === 0) return;

        try {
            await apiPost(`/rides/${currentRideId}/rate`, {
                rideId: currentRideId,
                rating,
                comment: ratingComment || undefined,
            });

            Alert.alert('¡Gracias!', 'Tu valoración ha sido registrada.');
            setScreenState('MAP_BROWSE');
            setSelectedDriver(null);
            setCurrentRideId(null);
            setRating(0);
            setRatingComment('');
            resetStatus();
        } catch (error) {
            Alert.alert('Error', 'No se pudo enviar la valoración');
        }
    }, [currentRideId, rating, ratingComment]);

    // Loading screen
    if (screenState === 'LOADING_LOCATION' || !userLocation) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={BrandColors.primary} />
                <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
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
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {/* Driver markers — only shown when NO active ride */}
                {!isRideActive && drivers.map((driver) => (
                    <Marker
                        key={driver.driverId}
                        coordinate={{
                            latitude: driver.latitude,
                            longitude: driver.longitude,
                        }}
                        onPress={() => onDriverPress(driver)}
                        title={driver.fullName || 'Conductor'}
                        description={`⭐ ${driver.rating.toFixed(1)} • ${driver.vehicleColor} ${driver.vehicleModel}`}
                        anchor={{ x: 0.5, y: 1 }}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[
                                styles.driverMarker,
                                selectedDriver?.driverId === driver.driverId && styles.driverMarkerSelected,
                            ]}>
                                <Ionicons name="car" size={16} color="#fff" />
                                <Text style={styles.driverMarkerRating}>
                                    {driver.rating.toFixed(1)}
                                </Text>
                            </View>
                            <View style={[
                                styles.markerTriangle,
                                selectedDriver?.driverId === driver.driverId && styles.markerTriangleSelected,
                            ]} />
                        </View>
                    </Marker>
                ))}

                {/* Real-time driver location during ride */}
                {driverLocation && (screenState === 'DRIVER_ACCEPTED' || screenState === 'IN_PROGRESS') && (
                    <Marker
                        coordinate={{
                            latitude: driverLocation.latitude,
                            longitude: driverLocation.longitude,
                        }}
                    >
                        <View style={styles.activeDriverMarker}>
                            <Ionicons name="car" size={24} color="#fff" />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Back button */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color={BrandColors.gray[800]} />
            </TouchableOpacity>

            {/* My location button */}
            <TouchableOpacity
                style={[styles.myLocationButton, { top: insets.top + 10 }]}
                onPress={() => {
                    mapRef.current?.animateToRegion({
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    }, 500);
                }}
            >
                <Ionicons name="locate" size={22} color={BrandColors.primary} />
            </TouchableOpacity>

            {/* Connection status */}
            {!isConnected && (
                <View style={[styles.connectionBanner, { top: insets.top + 60 }]}>
                    <Ionicons name="cloud-offline" size={16} color="#fff" />
                    <Text style={styles.connectionText}>Conectando...</Text>
                </View>
            )}

            {/* Bottom Panel */}
            <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                {/* MAP_BROWSE — Show drivers count */}
                {screenState === 'MAP_BROWSE' && (
                    <View>
                        <Text style={styles.panelTitle}>
                            🚕 Taxi Personal
                        </Text>
                        <Text style={styles.panelSubtitle}>
                            {driversLoading
                                ? 'Buscando conductores...'
                                : drivers.length > 0
                                    ? `${drivers.length} conductor${drivers.length > 1 ? 'es' : ''} disponible${drivers.length > 1 ? 's' : ''}`
                                    : 'No hay conductores disponibles cerca'
                            }
                        </Text>
                        {drivers.length > 0 && (
                            <>
                                <Text style={styles.hintText}>
                                    Toca un taxi en el mapa o envia una solicitud a todos los conductores
                                </Text>
                                <TouchableOpacity
                                    style={styles.broadcastButton}
                                    onPress={() => setScreenState('BROADCAST_DEST')}
                                >
                                    <Ionicons name="megaphone-outline" size={18} color="#fff" />
                                    <Text style={styles.broadcastButtonText}>Solicitar a cualquier taxi</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {/* BROADCAST_DEST — Entering destination for broadcast */}
                {screenState === 'BROADCAST_DEST' && (
                    <View>
                        <View style={styles.broadcastHeader}>
                            <Ionicons name="megaphone" size={22} color={BrandColors.secondary} />
                            <Text style={styles.panelTitle}>Solicitar a todos</Text>
                        </View>
                        <Text style={styles.panelSubtitle}>
                            Tu solicitud se enviará a {drivers.length} conductor{drivers.length > 1 ? 'es' : ''} disponible{drivers.length > 1 ? 's' : ''}
                        </Text>

                        {/* Destination input */}
                        <TouchableOpacity
                            style={styles.destInput}
                            onPress={() => setShowDestModal(true)}
                        >
                            <Ionicons name="location" size={18} color={BrandColors.primary} />
                            <Text style={destination ? styles.destText : styles.destPlaceholder}>
                                {destination || '¿A dónde vas?'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setScreenState('MAP_BROWSE')}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.broadcastButton}
                                onPress={handleBroadcastRide}
                            >
                                <Ionicons name="megaphone" size={18} color="#fff" />
                                <Text style={styles.broadcastButtonText}>Enviar solicitud</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* DRIVER_SELECTED — Show driver info + request button */}
                {screenState === 'DRIVER_SELECTED' && selectedDriver && (
                    <View>
                        <View style={styles.driverInfoRow}>
                            <View style={styles.driverAvatar}>
                                <Ionicons name="person" size={28} color={BrandColors.primary} />
                            </View>
                            <View style={styles.driverDetails}>
                                <Text style={styles.driverName}>{selectedDriver.fullName}</Text>
                                <Text style={styles.driverVehicle}>
                                    {selectedDriver.vehicleColor} {selectedDriver.vehicleModel} • {selectedDriver.vehiclePlate}
                                </Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                    <Text style={styles.ratingText}>{selectedDriver.rating.toFixed(1)}</Text>
                                    <Text style={styles.tripsText}> • {selectedDriver.totalTrips} viajes</Text>
                                </View>
                            </View>
                        </View>

                        {/* Destination input */}
                        <TouchableOpacity
                            style={styles.destInput}
                            onPress={() => setShowDestModal(true)}
                        >
                            <Ionicons name="location" size={18} color={BrandColors.primary} />
                            <Text style={destination ? styles.destText : styles.destPlaceholder}>
                                {destination || '¿A dónde vas?'}
                            </Text>
                        </TouchableOpacity>

                        {estimatedFare !== null && (
                            <View style={styles.fareEstimate}>
                                <Text style={styles.fareLabel}>Tarifa estimada:</Text>
                                <Text style={styles.fareAmount}>
                                    ${estimatedFare.toLocaleString('es-CO')} COP
                                </Text>
                            </View>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setScreenState('MAP_BROWSE');
                                    setSelectedDriver(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestButton}
                                onPress={handleRequestRide}
                            >
                                <Ionicons name="car" size={18} color="#fff" />
                                <Text style={styles.requestButtonText}>Solicitar Taxi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* WAITING_FOR_DRIVER */}
                {screenState === 'WAITING_FOR_DRIVER' && (
                    <View style={styles.waitingContainer}>
                        <ActivityIndicator size="large" color={BrandColors.secondary} />
                        <Text style={styles.waitingTitle}>
                            {isBroadcast ? 'Buscando conductor...' : 'Esperando respuesta...'}
                        </Text>
                        <Text style={styles.waitingSubtitle}>
                            {isBroadcast
                                ? `Solicitud enviada a ${driversNotified} conductor${driversNotified > 1 ? 'es' : ''}. El primero en aceptar será tu conductor.`
                                : 'El conductor decidirá si acepta tu solicitud'
                            }
                        </Text>
                        <TouchableOpacity style={styles.cancelWaitButton} onPress={handleCancel}>
                            <Text style={styles.cancelWaitText}>Cancelar solicitud</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* DRIVER_ACCEPTED */}
                {screenState === 'DRIVER_ACCEPTED' && rideData?.driver && (
                    <View>
                        <View style={styles.statusBadge}>
                            <Ionicons name="checkmark-circle" size={20} color={BrandColors.success} />
                            <Text style={styles.statusText}>¡Conductor en camino!</Text>
                        </View>
                        <View style={styles.driverInfoRow}>
                            <View style={styles.driverAvatar}>
                                <Ionicons name="person" size={28} color={BrandColors.primary} />
                            </View>
                            <View style={styles.driverDetails}>
                                <Text style={styles.driverName}>{rideData.driver.fullName}</Text>
                                {rideData.driver.driver && (
                                    <Text style={styles.driverVehicle}>
                                        {rideData.driver.driver.vehicleColor} {rideData.driver.driver.vehicleModel} • {rideData.driver.driver.vehiclePlate}
                                    </Text>
                                )}
                                {rideData.driver.phoneNumber && (
                                    <Text style={styles.phoneText}>
                                        📞 {rideData.driver.phoneNumber}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={styles.cancelSmall} onPress={handleCancel}>
                            <Text style={styles.cancelSmallText}>Cancelar viaje</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* IN_PROGRESS */}
                {screenState === 'IN_PROGRESS' && (
                    <View>
                        <View style={styles.statusBadge}>
                            <Ionicons name="navigate" size={20} color={BrandColors.info} />
                            <Text style={styles.statusText}>Viaje en progreso</Text>
                        </View>
                        <Text style={styles.progressHint}>
                            Puedes ver la ubicación del conductor en el mapa
                        </Text>
                    </View>
                )}

                {/* RATE_RIDE */}
                {screenState === 'RATE_RIDE' && (
                    <View>
                        <Text style={styles.rateTitle}>¿Cómo fue tu viaje?</Text>
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
                            style={[styles.requestButton, rating === 0 && styles.disabledButton]}
                            onPress={handleRate}
                            disabled={rating === 0}
                        >
                            <Text style={styles.requestButtonText}>Enviar valoración</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => {
                                setScreenState('MAP_BROWSE');
                                setCurrentRideId(null);
                                resetStatus();
                            }}
                        >
                            <Text style={styles.skipButtonText}>Omitir</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Destination Modal */}
            <Modal visible={showDestModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>¿A dónde vas?</Text>
                            <TouchableOpacity onPress={() => setShowDestModal(false)}>
                                <Ionicons name="close" size={24} color={BrandColors.gray[400]} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Zona de origen (barrio)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ej: Centro, La Esmeralda..."
                                value={originZone}
                                onChangeText={setOriginZone}
                                placeholderTextColor={BrandColors.gray[300]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Dirección de destino</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ej: CC Campanario"
                                value={destination}
                                onChangeText={setDestination}
                                placeholderTextColor={BrandColors.gray[300]}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Zona de destino (barrio)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ej: Centro, La Esmeralda..."
                                value={destZone}
                                onChangeText={setDestZone}
                                placeholderTextColor={BrandColors.gray[300]}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowDestModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestButton}
                                onPress={() => {
                                    setShowDestModal(false);
                                    if (destination.trim()) {
                                        if (screenState === 'DRIVER_SELECTED') {
                                            handleRequestRide();
                                        } else if (screenState === 'BROADCAST_DEST') {
                                            handleBroadcastRide();
                                        }
                                    }
                                }}
                            >
                                <Text style={styles.requestButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 16, fontSize: 16, color: BrandColors.gray[600] },
    map: { flex: 1 },

    // Markers
    markerContainer: {
        alignItems: 'center',
    },
    driverMarker: {
        backgroundColor: BrandColors.secondary,
        borderRadius: 12,
        padding: 5,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: '#d4b802',
    },
    markerTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#d4b802',
        marginTop: -1,
    },
    markerTriangleSelected: {
        borderTopColor: BrandColors.primaryDark,
    },
    driverMarkerSelected: {
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primaryDark,
    },
    driverMarkerRating: { color: '#fff', fontSize: 10, fontWeight: '700' },
    activeDriverMarker: {
        backgroundColor: BrandColors.primary,
        borderRadius: 24,
        padding: 8,
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },

    // Floating buttons
    backButton: {
        position: 'absolute',
        left: 16,
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
    myLocationButton: {
        position: 'absolute',
        right: 16,
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
    panelTitle: { fontSize: 20, fontWeight: '700', color: BrandColors.gray[900], marginBottom: 4 },
    panelSubtitle: { fontSize: 14, color: BrandColors.gray[600], marginBottom: 4 },
    hintText: { fontSize: 13, color: BrandColors.gray[400], fontStyle: 'italic' },

    // Driver info
    driverInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    driverAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverDetails: { flex: 1 },
    driverName: { fontSize: 17, fontWeight: '700', color: BrandColors.gray[900] },
    driverVehicle: { fontSize: 13, color: BrandColors.gray[600], marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    ratingText: { fontSize: 13, fontWeight: '600', color: '#f59e0b', marginLeft: 3 },
    tripsText: { fontSize: 12, color: BrandColors.gray[500] },
    phoneText: { fontSize: 13, color: BrandColors.primary, marginTop: 3 },

    // Destination
    destInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[50],
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        gap: 8,
    },
    destText: { fontSize: 14, color: BrandColors.gray[800], flex: 1 },
    destPlaceholder: { fontSize: 14, color: BrandColors.gray[400], flex: 1 },

    // Fare
    fareEstimate: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fef9c3',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    fareLabel: { fontSize: 14, color: BrandColors.gray[700] },
    fareAmount: { fontSize: 16, fontWeight: '700', color: BrandColors.gray[900] },

    // Buttons
    buttonRow: { flexDirection: 'row', gap: 10 },
    requestButton: {
        flex: 1,
        backgroundColor: BrandColors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    requestButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    cancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BrandColors.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: { color: BrandColors.gray[600], fontSize: 14, fontWeight: '600' },
    disabledButton: { opacity: 0.5 },

    // Waiting
    waitingContainer: { alignItems: 'center', paddingVertical: 8 },
    waitingTitle: { fontSize: 18, fontWeight: '700', color: BrandColors.gray[900], marginTop: 12 },
    waitingSubtitle: { fontSize: 14, color: BrandColors.gray[500], marginTop: 4, textAlign: 'center' },
    cancelWaitButton: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24 },
    cancelWaitText: { color: BrandColors.error, fontSize: 14, fontWeight: '600' },

    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#ecfdf5',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
    },
    statusText: { fontSize: 16, fontWeight: '700', color: BrandColors.gray[900] },

    // In progress
    progressHint: { fontSize: 14, color: BrandColors.gray[500], textAlign: 'center' },

    // Cancel small
    cancelSmall: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24, marginTop: 8 },
    cancelSmallText: { color: BrandColors.error, fontSize: 14, fontWeight: '600' },

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
    skipButton: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
    skipButtonText: { color: BrandColors.gray[500], fontSize: 14 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: BrandColors.gray[900] },
    modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },

    // Input
    inputGroup: { marginBottom: 14 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: BrandColors.gray[600], marginBottom: 4 },
    textInput: {
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
    },

    // Broadcast
    broadcastButton: {
        flex: 1,
        backgroundColor: BrandColors.secondary,
        borderRadius: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    broadcastButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    broadcastHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
});
