import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useGeneratePaymentQR } from '@/hooks/useQRPayment';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface GeneratePaymentQRModalProps {
    visible: boolean;
    onClose: () => void;
    walletId: string;
}

const EXPIRATION_OPTIONS = [
    { label: '5 minutos', value: 5 },
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '1 hora', value: 60 },
];

export function GeneratePaymentQRModal({ visible, onClose, walletId }: GeneratePaymentQRModalProps) {
    const { user } = useAuthStore();
    const generateQR = useGeneratePaymentQR();

    const [amount, setAmount] = useState('');
    const [selectedExpiration, setSelectedExpiration] = useState(15);
    const [generatedQR, setGeneratedQR] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // Countdown timer
    useEffect(() => {
        if (!generatedQR || !timeRemaining) return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    handleClose();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [generatedQR, timeRemaining]);

    const handleGenerate = async () => {
        const amountNum = parseFloat(amount);

        if (!amountNum || amountNum <= 0) {
            Alert.alert('Error', 'Por favor ingresa un monto válido');
            return;
        }

        if (amountNum < 1000) {
            Alert.alert('Error', 'El monto mínimo es $1,000');
            return;
        }

        try {
            const result = await generateQR.mutateAsync({
                amount: amountNum,
                walletId,
                expiresInMinutes: selectedExpiration,
            });

            setGeneratedQR(result);

            // Calculate time remaining in seconds
            const expiresAt = new Date(result.expiresAt).getTime();
            const now = Date.now();
            const remaining = Math.floor((expiresAt - now) / 1000);
            setTimeRemaining(remaining);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al generar el código QR');
        }
    };

    const handleShare = async () => {
        if (!generatedQR) return;

        try {
            await Share.share({
                message: `Paga ${formatCurrency(generatedQR.amount)} escaneando este código QR`,
                // Note: Can't share base64 image directly on all platforms
                // Would need to save to file system first for full functionality
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleClose = () => {
        setAmount('');
        setSelectedExpiration(15);
        setGeneratedQR(null);
        setTimeRemaining(null);
        onClose();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeInUp.duration(300).springify()}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {generatedQR ? 'Tu Código QR' : 'Generar Código QR'}
                            </Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {!generatedQR ? (
                                /* Generation Form */
                                <View style={styles.form}>
                                    {/* Amount Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Monto a cobrar</Text>
                                        <View style={styles.amountInputContainer}>
                                            <Text style={styles.currencySymbol}>$</Text>
                                            <TextInput
                                                style={styles.amountInput}
                                                value={amount}
                                                onChangeText={setAmount}
                                                placeholder="0"
                                                placeholderTextColor={BrandColors.gray[400]}
                                                keyboardType="numeric"
                                                maxLength={10}
                                            />
                                        </View>
                                        <Text style={styles.hint}>Mínimo: $1,000</Text>
                                    </View>

                                    {/* Expiration Selector */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Tiempo de expiración</Text>
                                        <View style={styles.expirationOptions}>
                                            {EXPIRATION_OPTIONS.map((option) => (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.expirationOption,
                                                        selectedExpiration === option.value &&
                                                        styles.expirationOptionSelected,
                                                    ]}
                                                    onPress={() => setSelectedExpiration(option.value)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.expirationOptionText,
                                                            selectedExpiration === option.value &&
                                                            styles.expirationOptionTextSelected,
                                                        ]}
                                                    >
                                                        {option.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Generate Button */}
                                    <Button
                                        title="Generar Código QR"
                                        onPress={handleGenerate}
                                        loading={generateQR.isPending}
                                        disabled={!amount || generateQR.isPending}
                                        style={styles.generateButton}
                                    />
                                </View>
                            ) : (
                                /* Generated QR Display */
                                <Animated.View
                                    entering={FadeInDown.duration(400).springify()}
                                    style={styles.qrDisplay}
                                >
                                    {/* QR Code */}
                                    <View style={styles.qrContainer}>
                                        <Image
                                            source={{ uri: generatedQR.qrCode }}
                                            style={styles.qrImage}
                                            resizeMode="contain"
                                        />
                                    </View>

                                    {/* Amount */}
                                    <Text style={styles.qrAmount}>
                                        {generatedQR?.amount ? formatCurrency(generatedQR.amount) : '$ 0'}
                                    </Text>

                                    {/* Countdown */}
                                    {timeRemaining !== null && (
                                        <View style={styles.countdownContainer}>
                                            <Ionicons name="time-outline" size={20} color={BrandColors.primary} />
                                            <Text style={styles.countdownText}>
                                                Expira en {formatTime(timeRemaining)}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Instructions */}
                                    <Text style={styles.instructions}>
                                        Comparte este código para recibir el pago
                                    </Text>

                                    {/* Actions */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={handleShare}
                                        >
                                            <Ionicons name="share-social" size={20} color={BrandColors.white} />
                                            <Text style={styles.actionButtonText}>Compartir</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: BrandColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        minHeight: 500,
    },
    modalContent: {
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: BrandColors.gray[100],
    },
    scrollView: {
        maxHeight: '100%',
    },
    scrollContent: {
        padding: 20,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: BrandColors.gray[300],
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: BrandColors.white,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[600],
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        paddingVertical: 16,
    },
    hint: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
    expirationOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    expirationOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.gray[300],
        backgroundColor: BrandColors.white,
    },
    expirationOptionSelected: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primaryLight,
    },
    expirationOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    expirationOptionTextSelected: {
        color: BrandColors.primary,
    },
    generateButton: {
        marginTop: 8,
    },
    qrDisplay: {
        alignItems: 'center',
        gap: 20,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    qrImage: {
        width: 250,
        height: 250,
    },
    qrAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: BrandColors.primaryLight,
        borderRadius: 20,
    },
    countdownText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.primary,
    },
    instructions: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: BrandColors.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
});
