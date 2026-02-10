import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useProcessEmergencyPayment } from '@/hooks/useConductor';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
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
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface EmergencyPaymentModalProps {
    visible: boolean;
    onClose: () => void;
}

export function EmergencyPaymentModal({ visible, onClose }: EmergencyPaymentModalProps) {
    const processPayment = useProcessEmergencyPayment();

    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [result, setResult] = useState<any>(null);

    const handleProcess = async () => {
        if (!username) {
            Alert.alert('Error', 'Por favor ingresa el username del pasajero');
            return;
        }

        if (code.length !== 8) {
            Alert.alert('Error', 'El código de emergencia debe tener 8 dígitos');
            return;
        }

        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum < 100) {
            Alert.alert('Error', 'El monto mínimo es $100');
            return;
        }

        try {
            const response = await processPayment.mutateAsync({
                passengerUsername: username.trim().toLowerCase(),
                emergencyCode: code,
                amount: amountNum,
            });

            setResult(response);
            setStep('success');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al procesar el pago de emergencia');
        }
    };

    const handleClose = () => {
        setUsername('');
        setCode('');
        setAmount('');
        setStep('form');
        setResult(null);
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
                            <Text style={styles.headerTitle}>
                                {step === 'form' ? 'Cobro de Emergencia' : '¡Pago Exitoso!'}
                            </Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {step === 'form' ? (
                                <View style={styles.form}>
                                    <View style={styles.warningBox}>
                                        <Ionicons name="warning" size={20} color={BrandColors.warning} />
                                        <Text style={styles.warningText}>
                                            Usa esta opción solo si el pasajero tiene el código de emergencia habilitado.
                                        </Text>
                                    </View>

                                    {/* Username Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Username del Pasajero</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="person-outline" size={20} color={BrandColors.gray[400]} />
                                            <TextInput
                                                style={styles.input}
                                                value={username}
                                                onChangeText={setUsername}
                                                placeholder="ej: juan_perez"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    {/* Amount Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Monto a cobrar</Text>
                                        <View style={[styles.inputContainer, styles.amountContainer]}>
                                            <Text style={styles.currencySymbol}>$</Text>
                                            <TextInput
                                                style={[styles.input, styles.amountInput]}
                                                value={amount}
                                                onChangeText={setAmount}
                                                placeholder="0"
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {/* Emergency Code Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Código de Emergencia (8 dígitos)</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="key-outline" size={20} color={BrandColors.gray[400]} />
                                            <TextInput
                                                style={styles.input}
                                                value={code}
                                                onChangeText={setCode}
                                                placeholder="12345678"
                                                keyboardType="numeric"
                                                maxLength={8}
                                                secureTextEntry
                                            />
                                        </View>
                                    </View>

                                    <Button
                                        title="Procesar Cobro"
                                        onPress={handleProcess}
                                        loading={processPayment.isPending}
                                        disabled={!username || code.length !== 8 || !amount}
                                        style={styles.processButton}
                                    />
                                </View>
                            ) : (
                                <Animated.View
                                    entering={FadeInDown.duration(400).springify()}
                                    style={styles.successDisplay}
                                >
                                    <View style={styles.successIconContainer}>
                                        <Ionicons name="checkmark-circle" size={80} color={BrandColors.success} />
                                    </View>

                                    <Text style={styles.successAmount}>{formatCurrency(result?.amount || 0)}</Text>
                                    <View style={styles.receiptContainer}>
                                        <View style={styles.receiptRow}>
                                            <Text style={styles.receiptLabel}>Pasajero:</Text>
                                            <Text style={styles.receiptValue}>{result?.fromUser?.name}</Text>
                                        </View>
                                        <View style={styles.receiptRow}>
                                            <Text style={styles.receiptLabel}>Referencia:</Text>
                                            <Text style={styles.receiptValue}>{result?.reference}</Text>
                                        </View>
                                    </View>

                                    <Button
                                        title="Cerrar"
                                        onPress={handleClose}
                                        variant="outline"
                                        fullWidth
                                    />
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
        minHeight: 550,
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
        gap: 20,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: BrandColors.warning + '15',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        alignItems: 'center',
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.warning,
        fontWeight: '500',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: BrandColors.gray[300],
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: BrandColors.gray[50],
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: BrandColors.gray[900],
    },
    amountContainer: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.white,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    amountInput: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    processButton: {
        marginTop: 10,
    },
    successDisplay: {
        alignItems: 'center',
        gap: 24,
        paddingTop: 20,
    },
    successIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: BrandColors.success + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    receiptContainer: {
        width: '100%',
        backgroundColor: BrandColors.gray[50],
        padding: 20,
        borderRadius: 16,
        gap: 12,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptLabel: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
    receiptValue: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
});
