import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentReceiptScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const {
        transactionId,
        reference,
        amount,
        fee,
        netAmount,
        conductorUsername,
        passengerUsername,
        createdAt,
        status
    } = useLocalSearchParams<{
        transactionId: string;
        reference: string;
        amount: string;
        fee?: string;
        netAmount?: string;
        conductorUsername: string;
        passengerUsername: string;
        createdAt: string;
        status: string;
    }>();

    const scale = useSharedValue(0);
    const checkmarkScale = useSharedValue(0);

    useEffect(() => {
        // Animate success icon
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });

        // Animate checkmark with delay
        setTimeout(() => {
            checkmarkScale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1, { damping: 10 })
            );
        }, 200);
    }, []);

    const successIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const checkmarkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkmarkScale.value }],
    }));

    const transactionDate = createdAt ? new Date(createdAt) : new Date();
    const formattedDate = transactionDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = transactionDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Exitoso';
            case 'PENDING': return 'En espera';
            case 'FAILED': return 'Fallido';
            default: return status || 'Exitoso';
        }
    };

    const handleGoToDashboard = () => {
        const path = user?.role === UserRole.DRIVER ? '/conductor/dashboard' : '/passenger/dashboard';
        router.replace(path as any);
    };

    const handleViewHistory = () => {
        const path = user?.role === UserRole.DRIVER ? '/conductor/transactions' : '/passenger/transactions';
        router.replace(path as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Success Icon */}
                <Animated.View style={[styles.successIconContainer, successIconStyle]}>
                    <View style={styles.successIconBackground}>
                        <Animated.View style={checkmarkStyle}>
                            <Ionicons
                                name={status === 'FAILED' ? "close-circle" : "checkmark-circle"}
                                size={80}
                                color={status === 'FAILED' ? BrandColors.error : BrandColors.success}
                            />
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Success Message */}
                <Animated.View
                    entering={FadeInDown.delay(300).duration(600).springify()}
                    style={styles.messageContainer}
                >
                    <Text style={styles.successTitle}>
                        {status === 'FAILED' ? 'Pago Fallido' : '¡Pago Exitoso!'}
                    </Text>
                    <Text style={styles.successSubtitle}>
                        {status === 'FAILED'
                            ? 'Hubo un problema al procesar tu pago'
                            : 'Tu pago se ha procesado correctamente'}
                    </Text>
                </Animated.View>

                {/* Amount */}
                <Animated.View
                    entering={FadeInUp.delay(500).duration(600).springify()}
                    style={styles.amountContainer}
                >
                    <Text style={styles.amountLabel}>Monto Pagado</Text>
                    <Text style={styles.amountValue}>{formatCurrency(Number(amount))}</Text>
                </Animated.View>

                {/* Transaction Details */}
                <Animated.View
                    entering={FadeInUp.delay(700).duration(600).springify()}
                    style={styles.detailsCard}
                >
                    <Text style={styles.detailsTitle}>Detalles de la Transacción</Text>

                    {user?.role === UserRole.DRIVER ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Pasajero</Text>
                            <Text style={styles.detailValue}>@{passengerUsername || 'usuario'}</Text>
                        </View>
                    ) : (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Conductor</Text>
                            <Text style={styles.detailValue}>@{conductorUsername || 'conductor'}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Estado</Text>
                        <Text style={[
                            styles.detailValue,
                            { color: status === 'FAILED' ? BrandColors.error : BrandColors.success }
                        ]}>
                            {getStatusLabel(status)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Referencia</Text>
                        <Text style={[styles.detailValue, styles.referenceText]}>
                            {reference}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha</Text>
                        <Text style={styles.detailValue}>{formattedDate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hora</Text>
                        <Text style={styles.detailValue}>{formattedTime}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>ID de Transacción</Text>
                        <Text style={[styles.detailValue, styles.transactionId]}>
                            {transactionId}
                        </Text>
                    </View>

                    {user?.role === UserRole.DRIVER && fee && netAmount && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.detailsTitle}>Desglose de Pago</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Valor del Pasaje</Text>
                                <Text style={styles.detailValue}>{formatCurrency(Number(amount))}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Tarifa de Plataforma (5%)</Text>
                                <Text style={[styles.detailValue, { color: BrandColors.error }]}>
                                    -{formatCurrency(Number(fee))}
                                </Text>
                            </View>

                            <View style={[styles.detailRow, { marginTop: 4 }]}>
                                <Text style={[styles.detailLabel, { fontWeight: 'bold', color: BrandColors.gray[900] }]}>
                                    Total Recibido
                                </Text>
                                <Text style={[styles.detailValue, { fontWeight: 'bold', color: BrandColors.success, fontSize: 16 }]}>
                                    {formatCurrency(Number(netAmount))}
                                </Text>
                            </View>

                            <View style={styles.infoMessageContainer}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={BrandColors.gray[500]} />
                                <Text style={styles.infoMessageText}>
                                    Esta comisión cubre la seguridad de tu dinero y el mantenimiento de la plataforma.
                                </Text>
                            </View>
                        </>
                    )}
                </Animated.View>

                {/* Info Message */}
                <Animated.View
                    entering={FadeInUp.delay(900).duration(600).springify()}
                    style={styles.infoCard}
                >
                    <Ionicons name="information-circle-outline" size={24} color={BrandColors.primary} />
                    <Text style={styles.infoText}>
                        Puedes ver esta transacción en tu historial en cualquier momento
                    </Text>
                </Animated.View>
            </ScrollView>

            {/* Action Buttons */}
            <Animated.View
                entering={FadeInUp.delay(1100).duration(600).springify()}
                style={styles.footer}
            >
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleViewHistory}
                >
                    <Ionicons name="time-outline" size={20} color={BrandColors.primary} />
                    <Text style={styles.secondaryButtonText}>Ver Historial</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleGoToDashboard}
                >
                    <Ionicons name="home-outline" size={20} color={BrandColors.white} />
                    <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    successIconContainer: {
        marginTop: 40,
        marginBottom: 24,
    },
    successIconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: BrandColors.success + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    amountContainer: {
        width: '100%',
        backgroundColor: BrandColors.primary,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        color: BrandColors.white,
        opacity: 0.9,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 40,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: BrandColors.gray[50],
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    referenceText: {
        color: BrandColors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    transactionId: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
        backgroundColor: BrandColors.gray[200],
        marginVertical: 12,
    },
    infoMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[100],
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    infoMessageText: {
        flex: 1,
        fontSize: 12,
        color: BrandColors.gray[600],
        fontStyle: 'italic',
        lineHeight: 16,
    },
    infoCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: BrandColors.primary + '10',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: BrandColors.primary + '20',
    },
    infoText: {
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
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.primary,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: BrandColors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
});
