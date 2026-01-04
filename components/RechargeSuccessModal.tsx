import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

interface RechargeSuccessModalProps {
    visible: boolean;
    amount: number;
    newBalance?: number;
    onClose: () => void;
}

export function RechargeSuccessModal({
    visible,
    amount,
    newBalance,
    onClose,
}: RechargeSuccessModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeInDown.duration(300).springify()}
                    style={styles.container}
                >
                    {/* Success Icon */}
                    <Animated.View
                        entering={ZoomIn.delay(200).springify()}
                        style={styles.iconContainer}
                    >
                        <Ionicons name="checkmark-circle" size={80} color={BrandColors.success} />
                    </Animated.View>

                    {/* Title */}
                    <Text style={styles.title}>¡Recarga Exitosa!</Text>

                    {/* Amount */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Monto Recargado</Text>
                        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
                    </View>

                    {/* New Balance */}
                    {newBalance !== undefined && (
                        <View style={styles.balanceContainer}>
                            <Text style={styles.balanceLabel}>Nuevo Saldo</Text>
                            <Text style={styles.balance}>{formatCurrency(newBalance)}</Text>
                        </View>
                    )}

                    {/* Button */}
                    <Button
                        title="Continuar"
                        onPress={onClose}
                    />
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
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: BrandColors.white,
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        gap: 20,
    },
    iconContainer: {
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
    },
    amountContainer: {
        alignItems: 'center',
        gap: 4,
    },
    amountLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.success,
    },
    balanceContainer: {
        alignItems: 'center',
        gap: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
        width: '100%',
    },
    balanceLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    balance: {
        fontSize: 24,
        fontWeight: '600',
        color: BrandColors.primary,
    },
});
