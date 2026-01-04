import { BrandColors } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data - esto vendrá del QR y la API
interface ConductorInfo {
    id: number;
    name: string;
    vehicle: string;
    plate: string;
    rating: number;
}

export default function PaymentConfirmationScreen() {
    const router = useRouter();
    const { qrData } = useLocalSearchParams<{ qrData: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conductorInfo, setConductorInfo] = useState<ConductorInfo | null>(null);
    const [amount, setAmount] = useState(5000); // Monto fijo por ahora
    const [balance, setBalance] = useState(50000); // Mock balance

    useEffect(() => {
        // Simular carga de información del conductor desde el QR
        const loadConductorInfo = async () => {
            try {
                setIsLoading(true);

                // Aquí iría la llamada a la API para obtener info del conductor
                // const response = await paymentService.getConductorInfo(qrData);

                // Mock data
                await new Promise(resolve => setTimeout(resolve, 1000));

                setConductorInfo({
                    id: 123,
                    name: 'Juan Pérez',
                    vehicle: 'Toyota Corolla',
                    plate: 'ABC-123',
                    rating: 4.8,
                });
            } catch (error) {
                Alert.alert(
                    'Error',
                    'No se pudo obtener la información del conductor. Por favor, intenta nuevamente.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadConductorInfo();
    }, [qrData]);

    const handleConfirmPayment = async () => {
        // Validar saldo suficiente
        if (balance < amount) {
            Alert.alert(
                'Saldo Insuficiente',
                'No tienes saldo suficiente para realizar este pago. ¿Deseas recargar tu billetera?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Recargar',
                        onPress: () => router.push('/(passenger)/recharge' as any),
                    },
                ]
            );
            return;
        }

        try {
            setIsProcessing(true);

            // Aquí iría la llamada a la API para procesar el pago
            // const response = await paymentService.payTransport(qrData);

            // Simular procesamiento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Navegar a la pantalla de recibo
            router.replace({
                pathname: '/(passenger)/payment-receipt' as any,
                params: {
                    transactionId: 'TXN-' + Date.now(),
                    amount: amount.toString(),
                    conductorName: conductorInfo?.name || '',
                    vehicle: conductorInfo?.vehicle || '',
                    plate: conductorInfo?.plate || '',
                },
            });
        } catch (error) {
            Alert.alert(
                'Error en el Pago',
                'No se pudo procesar el pago. Por favor, intenta nuevamente.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancelar Pago',
            '¿Estás seguro que deseas cancelar este pago?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí, Cancelar', onPress: () => router.back(), style: 'destructive' },
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Cargando información...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!conductorInfo) {
        return null;
    }

    const newBalance = balance - amount;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar Pago</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Conductor Info Card */}
                <Animated.View
                    entering={FadeInDown.duration(600).springify()}
                    style={styles.conductorCard}
                >
                    <View style={styles.conductorHeader}>
                        <View style={styles.conductorAvatar}>
                            <Ionicons name="person" size={32} color={BrandColors.primary} />
                        </View>
                        <View style={styles.conductorInfo}>
                            <Text style={styles.conductorName}>{conductorInfo.name}</Text>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={16} color={BrandColors.warning} />
                                <Text style={styles.ratingText}>{conductorInfo.rating.toFixed(1)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.vehicleInfo}>
                        <View style={styles.infoRow}>
                            <Ionicons name="car-outline" size={20} color={BrandColors.gray[600]} />
                            <Text style={styles.infoLabel}>Vehículo:</Text>
                            <Text style={styles.infoValue}>{conductorInfo.vehicle}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="card-outline" size={20} color={BrandColors.gray[600]} />
                            <Text style={styles.infoLabel}>Placa:</Text>
                            <Text style={styles.infoValue}>{conductorInfo.plate}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Payment Amount Card */}
                <Animated.View
                    entering={FadeInUp.delay(200).duration(600).springify()}
                    style={styles.amountCard}
                >
                    <Text style={styles.amountLabel}>Monto a Pagar</Text>
                    <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
                </Animated.View>

                {/* Balance Info */}
                <Animated.View
                    entering={FadeInUp.delay(400).duration(600).springify()}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Saldo actual:</Text>
                        <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
                    </View>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Nuevo saldo:</Text>
                        <Text style={[styles.balanceValue, styles.newBalance]}>
                            {formatCurrency(newBalance)}
                        </Text>
                    </View>
                </Animated.View>

                {/* Warning if low balance */}
                {newBalance < 10000 && (
                    <Animated.View
                        entering={FadeInUp.delay(600).duration(600).springify()}
                        style={styles.warningCard}
                    >
                        <Ionicons name="warning-outline" size={24} color={BrandColors.warning} />
                        <Text style={styles.warningText}>
                            Tu saldo quedará bajo después de este pago. Considera recargar tu billetera.
                        </Text>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    disabled={isProcessing}
                >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
                    onPress={handleConfirmPayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color={BrandColors.white} />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color={BrandColors.white} />
                            <Text style={styles.confirmButtonText}>Confirmar Pago</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    headerSpacer: {
        width: 44,
    },
    content: {
        padding: 20,
    },
    conductorCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    conductorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    conductorAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: BrandColors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    conductorInfo: {
        flex: 1,
    },
    conductorName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    divider: {
        height: 1,
        backgroundColor: BrandColors.gray[200],
        marginBottom: 16,
    },
    vehicleInfo: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginRight: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    amountCard: {
        backgroundColor: BrandColors.primary,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    amountLabel: {
        fontSize: 14,
        color: BrandColors.white,
        opacity: 0.9,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    balanceCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    balanceLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    newBalance: {
        color: BrandColors.primary,
    },
    warningCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: BrandColors.warning + '15',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: BrandColors.warning + '30',
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: BrandColors.white,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.gray[300],
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: BrandColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
});
