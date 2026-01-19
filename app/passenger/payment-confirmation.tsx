import { BrandColors } from '@/constants/theme';
import { useTransferFunds } from '@/hooks/useRecharge';
import { useWalletBalance } from '@/hooks/useWallet';
import { scanQRCode } from '@/services/usernameService';
import { getUserById } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
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

// Conductor info interface
interface ConductorInfo {
    id: number;
    name: string;
    username: string;
    vehicle: string;
    plate: string;
    rating: number;
}

export default function PaymentConfirmationScreen() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const { qrData, userId, amount: amountParam, transportType } = useLocalSearchParams<{
        qrData?: string;
        userId?: string;
        amount: string;
        transportType: string
    }>();

    const { data: balanceData } = useWalletBalance();
    const { mutate: transfer, isPending: isProcessing } = useTransferFunds();
    const [isLoading, setIsLoading] = useState(true);
    const [conductorInfo, setConductorInfo] = useState<ConductorInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const amount = parseFloat(amountParam || '0');
    const balance = typeof balanceData?.balance === 'string'
        ? parseFloat(balanceData.balance)
        : (balanceData?.balance || 0);

    useEffect(() => {
        const loadConductorInfo = async () => {
            if (!qrData && !userId) {
                setError('No se proporcionó información del conductor.');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                let response;

                if (qrData) {
                    response = await scanQRCode(qrData);
                } else if (userId) {
                    response = await getUserById(userId);
                }

                if (response) {
                    // Map API response to ConductorInfo
                    setConductorInfo({
                        id: response.id,
                        name: `${response.firstName} ${response.lastName}`,
                        username: response.username || 'conductor',
                        vehicle: response.driver?.vehicleType || 'Transporte',
                        plate: response.driver?.vehiclePlate || 'N/A',
                        rating: response.driver?.averageRating || 4.8,
                    });
                } else {
                    setError('No se pudo encontrar la información del conductor.');
                }
            } catch (err: any) {
                const message = err.response?.data?.message || err.message || 'Error al cargar información';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        loadConductorInfo();
    }, [qrData, userId]);

    const handleConfirmPayment = async () => {
        if (!conductorInfo) return;

        // Validar saldo suficiente
        if (balance < amount) {
            Alert.alert(
                'Saldo Insuficiente',
                'No tienes saldo suficiente para realizar este pago. ¿Deseas recargar tu billetera?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Recargar',
                        onPress: () => router.push('/passenger/recharge' as any),
                    },
                ]
            );
            return;
        }

        transfer(
            {
                toUserId: conductorInfo.id,
                amount: amount,
                description: `Pago de transporte: ${transportType}`,
            },
            {
                onSuccess: (response) => {
                    router.replace({
                        pathname: '/shared/payment-receipt' as any,
                        params: {
                            transactionId: response.transactionId,
                            reference: response.reference,
                            amount: amount.toString(),
                            fee: response.fee.toString(),
                            netAmount: response.netAmount.toString(),
                            conductorUsername: conductorInfo.username,
                            passengerUsername: currentUser?.username || 'usuario',
                            createdAt: new Date().toISOString(),
                            status: 'COMPLETED'
                        },
                    });
                },
                onError: (error: any) => {
                    Alert.alert(
                        'Error en el Pago',
                        error?.response?.data?.message || 'No se pudo procesar el pago. Por favor, intenta nuevamente.',
                        [{ text: 'OK' }]
                    );
                },
            }
        );
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
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={BrandColors.danger} />
                    <Text style={[styles.loadingText, { color: BrandColors.danger }]}>
                        {error || 'No se pudo encontrar la información del conductor.'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.confirmButton, { marginTop: 20, paddingHorizontal: 30 }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.confirmButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
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
                            <Ionicons name="bus-outline" size={20} color={BrandColors.gray[600]} />
                            <Text style={styles.infoLabel}>Transporte:</Text>
                            <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{transportType}</Text>
                        </View>
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
