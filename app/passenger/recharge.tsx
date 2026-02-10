import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { SecurityVerificationModal } from '@/components/SecurityVerificationModal';
import { Button, Card, ErrorMessage } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useProfileCompleteness } from '@/hooks/useProfile';
import { useFictitiousRecharge, useInitiateRecharge, useRedeemCode } from '@/hooks/useRecharge';
import { useAuthStore } from '@/store/authStore';
import { PaymentMethodType, RechargeRequest } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 5000000;

export default function RechargeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: completenessData } = useProfileCompleteness();
    const [amount, setAmount] = useState('');
    const [rechargeCode, setRechargeCode] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
    const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);
    const [error, setError] = useState('');

    const initiateRecharge = useInitiateRecharge();
    const fictitiousRecharge = useFictitiousRecharge();
    const redeemCode = useRedeemCode();

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
        setError('');
    };

    const handleRecharge = async () => {
        // Validar perfil completo
        const isProfileComplete = user?.profileCompleted || completenessData?.completed;

        if (user && !isProfileComplete) {
            Alert.alert(
                'Perfil Incompleto',
                'Debes completar tu información personal para realizar recargas.',
                [
                    { text: 'Ahora no', style: 'cancel' },
                    { text: 'Completar Perfil', onPress: () => router.push('/passenger/edit-profile') }
                ]
            );
            return;
        }

        if (!selectedPaymentMethod) {
            setError('Selecciona un método de pago');
            return;
        }

        if (selectedPaymentMethod === PaymentMethodType.CODE) {
            if (!rechargeCode) {
                setError('Ingresa un código de recarga');
                return;
            }

            redeemCode.mutate(rechargeCode, {
                onSuccess: (data: any) => {
                    router.replace({
                        pathname: '/shared/recharge-receipt' as any,
                        params: {
                            transactionId: data.transactionId,
                            reference: `RC-${rechargeCode}`,
                            amount: data.amount.toString(),
                            paymentMethod: 'Código de Recarga'
                        }
                    });
                },
                onError: (err: any) => {
                    setError(err?.response?.data?.message || 'Error al redimir el código');
                },
            });
            return;
        }

        const numericAmount = parseInt(amount, 10);
        if (!amount || isNaN(numericAmount)) {
            setError('Ingresa un monto válido');
            return;
        }

        if (numericAmount < MIN_AMOUNT) {
            setError(`El monto mínimo es ${formatCurrency(MIN_AMOUNT)}`);
            return;
        }

        if (numericAmount > MAX_AMOUNT) {
            setError(`El monto máximo es ${formatCurrency(MAX_AMOUNT)}`);
            return;
        }

        if (selectedPaymentMethod === PaymentMethodType.FICTITIOUS) {
            setIsSecurityModalVisible(true);
            return;
        }

        // Real payment flow (Wompi)
        try {
            setError('');
            const deepLink = Linking.createURL('/payment/success');
            const base64DeepLink = btoa(deepLink);
            const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
            const redirectUrl = `${apiBaseUrl}/payments/redirect?data=${base64DeepLink}`;

            const request: RechargeRequest = {
                amount: numericAmount,
                paymentMethodType: selectedPaymentMethod,
                redirectUrl,
            };

            const response = await initiateRecharge.mutateAsync(request);

            if (response.paymentUrl) {
                const canOpen = await Linking.canOpenURL(response.paymentUrl);
                if (canOpen) {
                    await Linking.openURL(response.paymentUrl);
                } else {
                    setError('No se pudo abrir la página de pago');
                }
            } else {
                Alert.alert('¡Recarga Iniciada!', `Se ha iniciado la recarga de ${formatCurrency(numericAmount)}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar la recarga');
        }
    };

    const proceedWithRecharge = () => {
        const numericAmount = parseInt(amount, 10);
        setIsSecurityModalVisible(false);

        fictitiousRecharge.mutate(
            { amount: numericAmount },
            {
                onSuccess: (data: any) => {
                    router.replace({
                        pathname: '/shared/recharge-receipt' as any,
                        params: {
                            transactionId: data.transactionId,
                            reference: data.reference,
                            amount: amount,
                            paymentMethod: 'Saldo Ficticio'
                        }
                    });
                },
                onError: (err: any) => {
                    setError(err?.response?.data?.message || 'Error al realizar la recarga');
                },
            }
        );
    };

    const isProcessing = initiateRecharge.isPending || fictitiousRecharge.isPending || redeemCode.isPending;
    const numericAmount = parseInt(amount, 10);
    const isValidAmount = !isNaN(numericAmount) && numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;

    const canContinue = selectedPaymentMethod === PaymentMethodType.CODE
        ? rechargeCode.length > 5
        : isValidAmount && !!selectedPaymentMethod;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recargar Saldo</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Payment Methods */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <PaymentMethodSelector
                        selected={selectedPaymentMethod}
                        onSelect={(method) => {
                            setSelectedPaymentMethod(method);
                            setError('');
                        }}
                    />
                </View>

                {selectedPaymentMethod === PaymentMethodType.CODE ? (
                    /* Recharge Code Input */
                    <Animated.View entering={FadeInDown.duration(300)}>
                        <Card variant="elevated" style={styles.amountCard}>
                            <Text style={styles.label}>Ingresa tu código de recarga</Text>
                            <View style={styles.amountInputContainer}>
                                <TextInput
                                    style={[styles.amountInput, { fontSize: 32, textAlign: 'center' }]}
                                    value={rechargeCode}
                                    onChangeText={(text) => {
                                        setRechargeCode(text.toUpperCase());
                                        setError('');
                                    }}
                                    placeholder="TP-XXXXXXXX"
                                    placeholderTextColor={BrandColors.gray[400]}
                                    autoCapitalize="characters"
                                    maxLength={15}
                                />
                            </View>
                            <Text style={styles.infoText}>
                                Los códigos de recarga son proporcionados por puntos autorizados.
                            </Text>
                        </Card>
                    </Animated.View>
                ) : (
                    <>
                        {/* Amount Input */}
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            <Card variant="elevated" style={styles.amountCard}>
                                <Text style={styles.label}>Monto a recargar</Text>
                                <View style={styles.amountInputContainer}>
                                    <Text style={styles.currencySymbol}>$</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        value={amount}
                                        onChangeText={(text) => {
                                            setAmount(text.replace(/[^0-9]/g, ''));
                                            setError('');
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={BrandColors.gray[400]}
                                        maxLength={10}
                                    />
                                </View>
                                {amount && (
                                    <Text style={styles.amountText}>
                                        {formatCurrency(parseInt(amount) || 0)}
                                    </Text>
                                )}
                            </Card>
                        </Animated.View>

                        {/* Quick Amounts */}
                        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                            <Text style={styles.sectionTitle}>Montos rápidos</Text>
                            <View style={styles.quickAmounts}>
                                {QUICK_AMOUNTS.map((value) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            styles.quickAmountButton,
                                            amount === value.toString() && styles.quickAmountButtonActive,
                                        ]}
                                        onPress={() => handleQuickAmount(value)}
                                    >
                                        <Text
                                            style={[
                                                styles.quickAmountText,
                                                amount === value.toString() && styles.quickAmountTextActive,
                                            ]}
                                        >
                                            {formatCurrency(value)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </>
                )}

                {/* Error Message */}
                {error && <ErrorMessage message={error} />}

                {/* Summary */}
                {canContinue && selectedPaymentMethod && (
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <Card variant="outlined" style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>
                                    {selectedPaymentMethod === PaymentMethodType.CODE ? 'Código' : 'Monto a recargar'}
                                </Text>
                                <Text style={styles.summaryValue}>
                                    {selectedPaymentMethod === PaymentMethodType.CODE ? rechargeCode : formatCurrency(parseInt(amount))}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Método de pago</Text>
                                <Text style={styles.summaryValue}>
                                    {selectedPaymentMethod}
                                </Text>
                            </View>
                        </Card>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Recharge Button */}
            <View style={styles.footer}>
                <Button
                    title={selectedPaymentMethod === PaymentMethodType.CODE ? 'Redimir Código' : 'Recargar'}
                    onPress={handleRecharge}
                    loading={isProcessing}
                    disabled={!canContinue || isProcessing}
                    fullWidth
                    size="large"
                />
            </View>

            <SecurityVerificationModal
                visible={isSecurityModalVisible}
                onSuccess={proceedWithRecharge}
                onCancel={() => setIsSecurityModalVisible(false)}
                title="Confirmar Recarga"
                subtitle={`Confirma la recarga de ${formatCurrency(parseInt(amount || '0'))} (Modo Prueba)`}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
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
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 20,
    },
    amountCard: {
        padding: 24,
        marginBottom: 24,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginBottom: 16,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        minWidth: 100,
    },
    amountText: {
        fontSize: 16,
        color: BrandColors.gray[600],
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 12,
    },
    quickAmounts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickAmountButton: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 16,
        paddingHorizontal: 12,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        alignItems: 'center',
    },
    quickAmountButtonActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.gray[50],
    },
    quickAmountText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    quickAmountTextActive: {
        color: BrandColors.primary,
    },
    summaryCard: {
        padding: 16,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    footer: {
        padding: 20,
        backgroundColor: BrandColors.white,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
    },
    infoText: {
        fontSize: 12,
        color: BrandColors.gray[500],
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
    },
});
