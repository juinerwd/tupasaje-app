import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useFictitiousRecharge, useInitiateRecharge, useRedeemCode } from '@/hooks/useRecharge';
import { PaymentMethodType, RechargeRequest } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SecurityVerificationModal } from './SecurityVerificationModal';

interface RechargeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SUGGESTED_AMOUNTS = [10000, 20000, 50000, 100000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 5000000;

export function RechargeModal({ visible, onClose, onSuccess }: RechargeModalProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [rechargeCode, setRechargeCode] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
    const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);

    const initiateRecharge = useInitiateRecharge();
    const fictitiousRecharge = useFictitiousRecharge();
    const redeemCode = useRedeemCode();

    const handleAmountChange = (text: string) => {
        // Only allow numbers
        const cleaned = text.replace(/[^0-9]/g, '');
        setAmount(cleaned);
    };

    const handleSuggestedAmount = (suggestedAmount: number) => {
        setAmount(suggestedAmount.toString());
    };

    const handleRecharge = async () => {
        if (!selectedMethod) {
            Alert.alert('Error', 'Selecciona un método de pago');
            return;
        }

        if (selectedMethod === PaymentMethodType.CODE) {
            if (!rechargeCode) {
                Alert.alert('Error', 'Ingresa un código de recarga');
                return;
            }

            redeemCode.mutate(rechargeCode, {
                onSuccess: (data: any) => {
                    handleClose();
                    router.push({
                        pathname: '/shared/recharge-receipt' as any,
                        params: {
                            transactionId: data.transactionId,
                            reference: `RC-${rechargeCode}`,
                            amount: data.amount.toString(),
                            paymentMethod: 'Código de Recarga'
                        }
                    });
                    onSuccess?.();
                },
                onError: (err: any) => {
                    Alert.alert('Error', err?.response?.data?.message || 'Error al redimir el código');
                },
            });
            return;
        }

        const numericAmount = parseInt(amount, 10);
        if (!amount || isNaN(numericAmount)) {
            Alert.alert('Error', 'Ingresa un monto válido');
            return;
        }

        if (numericAmount < MIN_AMOUNT) {
            Alert.alert('Error', `El monto mínimo es ${formatCurrency(MIN_AMOUNT)}`);
            return;
        }

        if (numericAmount > MAX_AMOUNT) {
            Alert.alert('Error', `El monto máximo es ${formatCurrency(MAX_AMOUNT)}`);
            return;
        }

        if (selectedMethod === PaymentMethodType.FICTITIOUS) {
            setIsSecurityModalVisible(true);
            return;
        }

        // Real payment flow (Wompi)
        try {
            const deepLink = Linking.createURL('/payment/success');
            const base64DeepLink = btoa(deepLink);
            const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
            const redirectUrl = `${apiBaseUrl}/payments/redirect?data=${base64DeepLink}`;

            const request: RechargeRequest = {
                amount: numericAmount,
                paymentMethodType: selectedMethod,
                redirectUrl,
            };

            const response = await initiateRecharge.mutateAsync(request);
            handleClose();

            if (response.paymentUrl) {
                const canOpen = await Linking.canOpenURL(response.paymentUrl);
                if (canOpen) {
                    await Linking.openURL(response.paymentUrl);
                } else {
                    Alert.alert('Error', 'No se pudo abrir la página de pago');
                }
            } else {
                Alert.alert('¡Recarga Iniciada!', `Se ha iniciado la recarga de ${formatCurrency(numericAmount)}`);
                onSuccess?.();
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al iniciar la recarga');
        }
    };

    const proceedWithFictitiousRecharge = () => {
        const numericAmount = parseInt(amount, 10);
        setIsSecurityModalVisible(false);

        fictitiousRecharge.mutate(
            { amount: numericAmount },
            {
                onSuccess: (data: any) => {
                    handleClose();
                    router.push({
                        pathname: '/shared/recharge-receipt' as any,
                        params: {
                            transactionId: data.transactionId,
                            reference: data.reference,
                            amount: amount,
                            paymentMethod: 'Saldo Ficticio'
                        }
                    });
                    onSuccess?.();
                },
                onError: (err: any) => {
                    Alert.alert('Error', err?.response?.data?.message || 'Error al realizar la recarga');
                },
            }
        );
    };

    const handleClose = () => {
        setAmount('');
        setRechargeCode('');
        setSelectedMethod(null);
        onClose();
    };

    const numericAmount = parseInt(amount, 10);
    const isWompiMethod = selectedMethod &&
        selectedMethod !== PaymentMethodType.CODE &&
        selectedMethod !== PaymentMethodType.FICTITIOUS;

    const isValidAmount = !isNaN(numericAmount) && numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;
    const isProcessing = initiateRecharge.isPending || fictitiousRecharge.isPending || redeemCode.isPending;

    const canContinue = selectedMethod === PaymentMethodType.CODE
        ? rechargeCode.length > 5
        : isValidAmount && !!selectedMethod;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={28} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recargar Saldo</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Payment Method Selection first (like RechargeScreen) */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.section}
                    >
                        <PaymentMethodSelector
                            selected={selectedMethod}
                            onSelect={setSelectedMethod}
                        />
                    </Animated.View>

                    {selectedMethod === PaymentMethodType.CODE ? (
                        /* Recharge Code Input */
                        <Animated.View
                            entering={FadeInDown.duration(300)}
                            style={styles.section}
                        >
                            <Text style={styles.sectionTitle}>Código de Recarga</Text>
                            <View style={styles.amountInputContainer}>
                                <TextInput
                                    style={[styles.amountInput, { fontSize: 24, textAlign: 'center' }]}
                                    value={rechargeCode}
                                    onChangeText={(text) => setRechargeCode(text.toUpperCase())}
                                    placeholder="TP-XXXXXXXX"
                                    placeholderTextColor={BrandColors.gray[400]}
                                    autoCapitalize="characters"
                                    maxLength={15}
                                />
                            </View>
                            <Text style={styles.infoTextSmall}>
                                Los códigos de recarga son proporcionados por puntos autorizados.
                            </Text>
                        </Animated.View>
                    ) : (
                        <>
                            {/* Amount Input */}
                            <Animated.View
                                entering={FadeInDown.delay(200).springify()}
                                style={styles.section}
                            >
                                <Text style={styles.sectionTitle}>Monto a Recargar</Text>
                                <View style={styles.amountInputContainer}>
                                    <Text style={styles.currencySymbol}>$</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                </View>
                                {amount && !isValidAmount && (
                                    <Text style={styles.errorText}>
                                        Monto debe estar entre {formatCurrency(MIN_AMOUNT)} y {formatCurrency(MAX_AMOUNT)}
                                    </Text>
                                )}
                            </Animated.View>

                            {/* Suggested Amounts */}
                            <Animated.View
                                entering={FadeInDown.delay(300).springify()}
                                style={styles.section}
                            >
                                <Text style={styles.sectionTitle}>Montos Sugeridos</Text>
                                <View style={styles.suggestedAmounts}>
                                    {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                                        <TouchableOpacity
                                            key={suggestedAmount}
                                            style={[
                                                styles.suggestedButton,
                                                numericAmount === suggestedAmount && styles.suggestedButtonActive,
                                            ]}
                                            onPress={() => handleSuggestedAmount(suggestedAmount)}
                                        >
                                            <Text style={[
                                                styles.suggestedButtonText,
                                                numericAmount === suggestedAmount && styles.suggestedButtonTextActive,
                                            ]}>
                                                {formatCurrency(suggestedAmount)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Animated.View>
                        </>
                    )}

                    {/* Info Text based on method */}
                    {selectedMethod && (
                        <Animated.View
                            entering={FadeInDown.delay(400).springify()}
                            style={styles.infoContainer}
                        >
                            <Ionicons
                                name={isWompiMethod ? "shield-checkmark" : "information-circle"}
                                size={20}
                                color={BrandColors.info}
                            />
                            <Text style={styles.infoText}>
                                {selectedMethod === PaymentMethodType.CODE
                                    ? "Ingresa el código de 8 a 12 caracteres para redimir tu saldo inmediatamente."
                                    : isWompiMethod
                                        ? "Serás redirigido a la plataforma de pago segura para completar la transacción."
                                        : "Este es un método de prueba para recargar saldo ficticio en modo desarrollo."}
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Button
                        title={selectedMethod === PaymentMethodType.CODE ? "Redimir Código" : `Recargar ${amount ? formatCurrency(numericAmount) : ''}`}
                        onPress={handleRecharge}
                        disabled={!canContinue || isProcessing}
                        loading={isProcessing}
                    />
                </View>

                <SecurityVerificationModal
                    visible={isSecurityModalVisible}
                    onSuccess={proceedWithFictitiousRecharge}
                    onCancel={() => setIsSecurityModalVisible(false)}
                    title="Confirmar Recarga"
                    subtitle={`Confirma la recarga de ${formatCurrency(parseInt(amount || '0'))} (Modo Prueba)`}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.gray[600],
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    errorText: {
        fontSize: 14,
        color: BrandColors.error,
    },
    suggestedAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    suggestedButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: BrandColors.white,
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
    },
    suggestedButtonActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primaryLight,
    },
    suggestedButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    suggestedButtonTextActive: {
        color: BrandColors.primary,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        backgroundColor: '#e0f2fe',
        borderRadius: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.info,
        lineHeight: 20,
    },
    infoTextSmall: {
        fontSize: 12,
        color: BrandColors.gray[500],
        textAlign: 'center',
        marginTop: 4,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: BrandColors.white,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
    },
});
