import { Button, Card, ErrorMessage } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useFictitiousRecharge } from '@/hooks/useRecharge';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

export default function RechargeScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const { mutate: recharge, isPending: isLoading } = useFictitiousRecharge();
    const [error, setError] = useState('');

    const paymentMethods = [
        { id: 'pse', name: 'PSE', icon: 'card-outline' as keyof typeof Ionicons.glyphMap },
        { id: 'card', name: 'Tarjeta', icon: 'card-outline' as keyof typeof Ionicons.glyphMap },
        { id: 'cash', name: 'Efectivo', icon: 'cash-outline' as keyof typeof Ionicons.glyphMap },
        { id: 'fictitious', name: 'Saldo Ficticio (Beta)', icon: 'flask-outline' as keyof typeof Ionicons.glyphMap },
    ];

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
        setError('');
    };

    const handleRecharge = async () => {
        if (!amount || parseInt(amount) <= 0) {
            setError('Ingresa un monto válido');
            return;
        }

        if (!selectedPaymentMethod) {
            setError('Selecciona un método de pago');
            return;
        }

        setError('');

        recharge(
            { amount: parseInt(amount) },
            {
                onSuccess: () => {
                    Alert.alert('Éxito', 'Recarga realizada correctamente', [
                        { text: 'OK', onPress: () => router.back() },
                    ]);
                },
                onError: (err: any) => {
                    setError(err?.response?.data?.message || 'Error al realizar la recarga');
                },
            }
        );
    };

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
                {/* Amount Input */}
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
                        />
                    </View>
                    {amount && (
                        <Text style={styles.amountText}>
                            {formatCurrency(parseInt(amount) || 0)}
                        </Text>
                    )}
                </Card>

                {/* Quick Amounts */}
                <View style={styles.section}>
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
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de pago</Text>
                    {paymentMethods.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.paymentMethod,
                                selectedPaymentMethod === method.id && styles.paymentMethodActive,
                            ]}
                            onPress={() => {
                                setSelectedPaymentMethod(method.id);
                                setError('');
                            }}
                        >
                            <View style={styles.paymentMethodLeft}>
                                <View
                                    style={[
                                        styles.paymentMethodIcon,
                                        selectedPaymentMethod === method.id && styles.paymentMethodIconActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={method.icon}
                                        size={24}
                                        color={
                                            selectedPaymentMethod === method.id
                                                ? BrandColors.primary
                                                : BrandColors.gray[600]
                                        }
                                    />
                                </View>
                                <Text style={styles.paymentMethodName}>{method.name}</Text>
                            </View>
                            {selectedPaymentMethod === method.id && (
                                <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Error Message */}
                {error && <ErrorMessage message={error} />}

                {/* Summary */}
                {amount && selectedPaymentMethod && (
                    <Card variant="outlined" style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Monto a recargar</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(parseInt(amount))}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Método de pago</Text>
                            <Text style={styles.summaryValue}>
                                {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name}
                            </Text>
                        </View>
                    </Card>
                )}
            </ScrollView>

            {/* Recharge Button */}
            <View style={styles.footer}>
                <Button
                    title="Recargar"
                    onPress={handleRecharge}
                    loading={isLoading}
                    disabled={!amount || !selectedPaymentMethod || isLoading}
                    fullWidth
                    size="large"
                />
            </View>
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
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        marginBottom: 12,
    },
    paymentMethodActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.gray[50],
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentMethodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentMethodIconActive: {
        backgroundColor: BrandColors.primary + '20',
    },
    paymentMethodName: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
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
});
