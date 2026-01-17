import { GeneratePaymentQRModal } from '@/components/GeneratePaymentQRModal';
import { PaymentConfirmationModal } from '@/components/PaymentConfirmationModal';
import { QRScannerModal } from '@/components/QRScannerModal';
import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useActiveQRs, useCancelQR, useValidateQR } from '@/hooks/useQRPayment';
import { useAuthStore } from '@/store/authStore';
import { QRStatus } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function QRPaymentScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: activeQRs, isLoading: isLoadingQRs, refetch: refetchQRs } = useActiveQRs();
    const validateQR = useValidateQR();
    const cancelQR = useCancelQR();

    const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [scannedToken, setScannedToken] = useState<string | null>(null);
    const [scannedAmount, setScannedAmount] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);

    // Use user ID as walletId (simplified - in production you'd fetch the actual wallet ID)
    const walletId = user?.id?.toString() || '';

    const onRefresh = async () => {
        setRefreshing(true);
        await refetchQRs();
        setRefreshing(false);
    };

    const handleScan = (data: string) => {
        try {
            // Parse QR data (assuming it's JSON with token and amount)
            const qrData = JSON.parse(data);
            setScannedToken(qrData.token);
            setScannedAmount(qrData.amount || 0);
            setShowConfirmModal(true);
        } catch (error) {
            Alert.alert('Error', 'Código QR inválido');
        }
    };

    const handleConfirmPayment = async () => {
        if (!scannedToken) return;

        try {
            const result = await validateQR.mutateAsync({ token: scannedToken });

            setShowConfirmModal(false);
            setScannedToken(null);
            setScannedAmount(0);

            if (result.success) {
                Alert.alert(
                    '¡Pago Exitoso!',
                    `Has pagado ${formatCurrency(result.transaction?.amount || 0)}`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', result.message || 'Error al procesar el pago');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al procesar el pago');
        }
    };

    const handleCancelPayment = () => {
        setShowConfirmModal(false);
        setScannedToken(null);
        setScannedAmount(0);
    };

    const handleCancelQR = async (token: string) => {
        Alert.alert(
            'Cancelar Código QR',
            '¿Estás seguro que deseas cancelar este código QR?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelQR.mutateAsync(token);
                            Alert.alert('Éxito', 'Código QR cancelado');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo cancelar el código QR');
                        }
                    },
                },
            ]
        );
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = Date.now();
        const expiry = new Date(expiresAt).getTime();
        const remaining = Math.floor((expiry - now) / 1000);

        if (remaining <= 0) return 'Expirado';

        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[BrandColors.primary, BrandColors.primaryDark]}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pagos con QR</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'generate' && styles.tabActive]}
                        onPress={() => setActiveTab('generate')}
                    >
                        <Ionicons
                            name="qr-code"
                            size={20}
                            color={activeTab === 'generate' ? BrandColors.primary : BrandColors.white}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'generate' && styles.tabTextActive,
                            ]}
                        >
                            Generar QR
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
                        onPress={() => setActiveTab('scan')}
                    >
                        <Ionicons
                            name="scan"
                            size={20}
                            color={activeTab === 'scan' ? BrandColors.primary : BrandColors.white}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'scan' && styles.tabTextActive,
                            ]}
                        >
                            Escanear QR
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {activeTab === 'generate' ? (
                    /* Generate Tab */
                    <View style={styles.tabContent}>
                        {/* Generate Button */}
                        <AnimatedTouchable
                            entering={FadeInDown.delay(100).springify()}
                            style={styles.generateCard}
                            onPress={() => setShowGenerateModal(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.generateIconContainer}>
                                <Ionicons name="add-circle" size={48} color={BrandColors.primary} />
                            </View>
                            <Text style={styles.generateTitle}>Generar Código QR</Text>
                            <Text style={styles.generateSubtitle}>
                                Crea un código QR para recibir pagos
                            </Text>
                        </AnimatedTouchable>

                        {/* Active QRs */}
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <Text style={styles.sectionTitle}>Códigos QR Activos</Text>

                            {isLoadingQRs ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={BrandColors.primary} />
                                </View>
                            ) : activeQRs && activeQRs.length > 0 ? (
                                <View style={styles.qrList}>
                                    {activeQRs.map((qr, index) => (
                                        <Animated.View
                                            key={qr.id}
                                            entering={FadeInLeft.delay(index * 100).springify()}
                                        >
                                            <Card style={styles.qrCard}>
                                                <View style={styles.qrCardHeader}>
                                                    <View>
                                                        <Text style={styles.qrAmount}>
                                                            {formatCurrency(qr.amount)}
                                                        </Text>
                                                        <Text style={styles.qrStatus}>
                                                            {qr.status === QRStatus.ACTIVE && (
                                                                <>
                                                                    <Ionicons
                                                                        name="time-outline"
                                                                        size={14}
                                                                        color={BrandColors.success}
                                                                    />
                                                                    {' '}
                                                                    {getTimeRemaining(qr.expiresAt)}
                                                                </>
                                                            )}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => handleCancelQR(qr.token)}
                                                        style={styles.cancelButton}
                                                    >
                                                        <Ionicons
                                                            name="close-circle"
                                                            size={24}
                                                            color={BrandColors.error}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </Card>
                                        </Animated.View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons
                                        name="qr-code-outline"
                                        size={64}
                                        color={BrandColors.gray[400]}
                                    />
                                    <Text style={styles.emptyText}>No tienes códigos QR activos</Text>
                                </View>
                            )}
                        </Animated.View>
                    </View>
                ) : (
                    /* Scan Tab */
                    <View style={styles.tabContent}>
                        <AnimatedTouchable
                            entering={FadeInDown.delay(100).springify()}
                            style={styles.scanCard}
                            onPress={() => setShowScannerModal(true)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.scanIconContainer}>
                                <Ionicons name="scan" size={48} color={BrandColors.primary} />
                            </View>
                            <Text style={styles.scanTitle}>Escanear Código QR</Text>
                            <Text style={styles.scanSubtitle}>
                                Apunta la cámara al código QR para pagar
                            </Text>
                        </AnimatedTouchable>

                        {/* Instructions */}
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <Card style={styles.instructionsCard}>
                                <Text style={styles.instructionsTitle}>¿Cómo funciona?</Text>
                                <View style={styles.instructionsList}>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Text style={styles.instructionNumberText}>1</Text>
                                        </View>
                                        <Text style={styles.instructionText}>
                                            Toca el botón "Escanear Código QR"
                                        </Text>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Text style={styles.instructionNumberText}>2</Text>
                                        </View>
                                        <Text style={styles.instructionText}>
                                            Apunta la cámara al código QR
                                        </Text>
                                    </View>
                                    <View style={styles.instructionItem}>
                                        <View style={styles.instructionNumber}>
                                            <Text style={styles.instructionNumberText}>3</Text>
                                        </View>
                                        <Text style={styles.instructionText}>
                                            Confirma el pago y listo
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </Animated.View>
                    </View>
                )}
            </ScrollView>

            {/* Modals */}
            <GeneratePaymentQRModal
                visible={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
                walletId={walletId}
            />

            <QRScannerModal
                visible={showScannerModal}
                onClose={() => setShowScannerModal(false)}
                onScan={handleScan}
            />

            <PaymentConfirmationModal
                visible={showConfirmModal}
                amount={scannedAmount}
                onConfirm={handleConfirmPayment}
                onCancel={handleCancelPayment}
                loading={validateQR.isPending}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    gradient: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    tabs: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    tabActive: {
        backgroundColor: BrandColors.white,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.white,
    },
    tabTextActive: {
        color: BrandColors.primary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    tabContent: {
        gap: 24,
    },
    generateCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    generateIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    generateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    generateSubtitle: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 12,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    qrList: {
        gap: 12,
    },
    qrCard: {
        padding: 16,
    },
    qrCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qrAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    qrStatus: {
        fontSize: 14,
        color: BrandColors.success,
        marginTop: 4,
    },
    cancelButton: {
        padding: 8,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: BrandColors.gray[500],
    },
    scanCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    scanIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    scanSubtitle: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    instructionsCard: {
        padding: 20,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    instructionsList: {
        gap: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    instructionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[700],
    },
});
