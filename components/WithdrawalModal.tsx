import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRequestWithdrawal } from '@/hooks/useConductor';
import { useWithdrawalMethods } from '@/hooks/useWithdrawalMethods';
import { WithdrawalMethodType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface WithdrawalModalProps {
    visible: boolean;
    onClose: () => void;
    availableBalance: number;
    navigationRouter: () => void;
}

export function WithdrawalModal({ visible, onClose, availableBalance, navigationRouter }: WithdrawalModalProps) {
    const [amount, setAmount] = useState('');
    const { data: methods, isLoading: isLoadingMethods } = useWithdrawalMethods();
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const withdrawalMutation = useRequestWithdrawal();

    useEffect(() => {
        if (methods && methods.length > 0 && !selectedMethodId) {
            const defaultMethod = methods.find(m => m.isDefault) || methods[0];
            setSelectedMethodId(defaultMethod.id);
        }
    }, [methods]);

    const handleWithdraw = async () => {
        const amountNum = parseFloat(amount);

        if (!amountNum || amountNum <= 0) {
            Alert.alert('Error', 'Por favor ingresa un monto válido');
            return;
        }

        if (amountNum > availableBalance) {
            Alert.alert('Error', 'No tienes suficiente saldo disponible');
            return;
        }

        if (amountNum < 5000) {
            Alert.alert('Error', 'El monto mínimo de retiro es $5,000');
            return;
        }

        if (!selectedMethodId) {
            Alert.alert('Error', 'Por favor selecciona un método de retiro');
            return;
        }

        try {
            const result = await withdrawalMutation.mutateAsync({
                amount: amountNum,
                methodId: selectedMethodId
            });
            Alert.alert('¡Éxito!', result.message || 'Retiro solicitado correctamente');
            handleClose();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al procesar el retiro');
        }
    };

    const handleClose = () => {
        setAmount('');
        onClose();
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
                            <Text style={styles.headerTitle}>Retirar Ganancias</Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            {/* Available Balance Info */}
                            <View style={styles.balanceInfo}>
                                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                                <Text style={styles.balanceValue}>{formatCurrency(availableBalance)}</Text>
                            </View>

                            {/* Amount Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Monto a retirar</Text>
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
                                        autoFocus
                                    />
                                </View>
                                <Text style={styles.hint}>Mínimo: $5,000</Text>
                            </View>

                            {/* Withdrawal Method Selector */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Recibir en</Text>
                                {isLoadingMethods ? (
                                    <View style={styles.loadingMethods}>
                                        <ActivityIndicator size="small" color={BrandColors.primary} />
                                    </View>
                                ) : methods && methods.length > 0 ? (
                                    <View style={styles.methodsList}>
                                        {methods.map((method) => (
                                            <TouchableOpacity
                                                key={method.id}
                                                style={[
                                                    styles.methodItem,
                                                    selectedMethodId === method.id && styles.methodItemActive
                                                ]}
                                                onPress={() => setSelectedMethodId(method.id)}
                                            >
                                                <Ionicons
                                                    name={method.type === WithdrawalMethodType.NEQUI ? 'phone-portrait-outline' : 'business-outline'}
                                                    size={20}
                                                    color={selectedMethodId === method.id ? BrandColors.primary : BrandColors.gray[400]}
                                                />
                                                <Text style={[
                                                    styles.methodText,
                                                    selectedMethodId === method.id && styles.methodTextActive
                                                ]}>
                                                    {method.type === WithdrawalMethodType.BANK_ACCOUNT ? method.bankName : method.type} (***{method.accountNumber.slice(-4)})
                                                </Text>
                                                {selectedMethodId === method.id && (
                                                    <Ionicons name="checkmark-circle" size={20} color={BrandColors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.noMethods}
                                        onPress={() => {
                                            handleClose();
                                            // We'll need to navigate to withdrawal methods screen
                                            // but since we are in a modal, we might need a different approach
                                            // for now just a message
                                            navigationRouter();
                                        }}
                                    >
                                        <Text style={styles.noMethodsText}>Configurar método de retiro</Text>
                                        <Ionicons name="chevron-forward" size={20} color={BrandColors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Info Box */}
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={20} color={BrandColors.primary} />
                                <Text style={styles.infoText}>
                                    El tiempo estimado es de 24 a 48 horas hábiles.
                                </Text>
                            </View>

                            {/* Action Button */}
                            <Button
                                title="Confirmar Retiro"
                                onPress={handleWithdraw}
                                loading={withdrawalMutation.isPending}
                                disabled={!amount || withdrawalMutation.isPending}
                                style={styles.withdrawButton}
                            />
                        </View>
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
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: BrandColors.white,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalContent: {
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: BrandColors.gray[100],
    },
    content: {
        padding: 20,
        gap: 24,
    },
    balanceInfo: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: BrandColors.primary + '05',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BrandColors.primary + '10',
    },
    balanceLabel: {
        fontSize: 14,
        color: BrandColors.gray[500],
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.primary,
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
        borderColor: BrandColors.gray[200],
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: BrandColors.white,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[400],
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        paddingVertical: 12,
    },
    hint: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: BrandColors.primary + '08',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: BrandColors.gray[600],
        lineHeight: 18,
    },
    withdrawButton: {
        marginTop: 8,
    },
    loadingMethods: {
        padding: 12,
        alignItems: 'center',
    },
    methodsList: {
        gap: 8,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        gap: 12,
    },
    methodItemActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primary + '05',
    },
    methodText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    methodTextActive: {
        color: BrandColors.gray[900],
        fontWeight: '600',
    },
    noMethods: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.primary,
        borderStyle: 'dashed',
    },
    noMethodsText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
});
