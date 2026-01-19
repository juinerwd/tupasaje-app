import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useInitiateRecharge } from '@/hooks/useRecharge';
import { PaymentMethodType, RechargeRequest } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
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

interface RechargeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SUGGESTED_AMOUNTS = [10000, 20000, 50000, 100000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 5000000;

export function RechargeModal({ visible, onClose, onSuccess }: RechargeModalProps) {
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
    const initiateRecharge = useInitiateRecharge();

    const handleAmountChange = (text: string) => {
        // Only allow numbers
        const cleaned = text.replace(/[^0-9]/g, '');
        setAmount(cleaned);
    };

    const handleSuggestedAmount = (suggestedAmount: number) => {
        setAmount(suggestedAmount.toString());
    };

    const handleRecharge = async () => {
        const numericAmount = parseInt(amount, 10);

        // Validation
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

        if (!selectedMethod) {
            Alert.alert('Error', 'Selecciona un método de pago');
            return;
        }

        try {
            // Create redirect URL for deep linking
            // Wompi requires http/https, so we use our backend as a proxy redirector
            // We encode the deep link in Base64 to bypass Wompi/CloudFront WAF filters that block "exp://"
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

            // Close modal
            handleClose();

            // Open payment URL if available
            if (response.paymentUrl) {
                const canOpen = await Linking.canOpenURL(response.paymentUrl);
                if (canOpen) {
                    await Linking.openURL(response.paymentUrl);
                } else {
                    Alert.alert('Error', 'No se pudo abrir la página de pago');
                }
            } else {
                // If no payment URL, show success (for test mode)
                Alert.alert(
                    '¡Recarga Iniciada!',
                    `Se ha iniciado la recarga de ${formatCurrency(numericAmount)}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => onSuccess?.(),
                        },
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Error al iniciar la recarga'
            );
        }
    };

    const handleClose = () => {
        setAmount('');
        setSelectedMethod(null);
        onClose();
    };

    const numericAmount = parseInt(amount, 10);
    const isValidAmount = !isNaN(numericAmount) && numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;

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
                    {/* Amount Input */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
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
                        entering={FadeInDown.delay(200).springify()}
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

                    {/* Payment Method */}
                    <Animated.View
                        entering={FadeInDown.delay(300).springify()}
                        style={styles.section}
                    >
                        <PaymentMethodSelector
                            selected={selectedMethod}
                            onSelect={setSelectedMethod}
                        />
                    </Animated.View>

                    {/* Info */}
                    <Animated.View
                        entering={FadeInDown.delay(400).springify()}
                        style={styles.infoContainer}
                    >
                        <Ionicons name="information-circle" size={20} color={BrandColors.info} />
                        <Text style={styles.infoText}>
                            Serás redirigido a la plataforma de pago segura para completar la transacción
                        </Text>
                    </Animated.View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Button
                        title={`Recargar ${amount ? formatCurrency(numericAmount) : ''}`}
                        onPress={handleRecharge}
                        disabled={!isValidAmount || !selectedMethod || initiateRecharge.isPending}
                        loading={initiateRecharge.isPending}
                    />
                </View>
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
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: BrandColors.white,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
    },
});
