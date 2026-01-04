import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PaymentConfirmationModalProps {
    visible: boolean;
    amount: number;
    recipientName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function PaymentConfirmationModal({
    visible,
    amount,
    recipientName,
    onConfirm,
    onCancel,
    loading = false,
}: PaymentConfirmationModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeInDown.duration(300).springify()}
                    style={styles.modalContainer}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="qr-code" size={48} color={BrandColors.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Confirmar Pago</Text>

                    {/* Details */}
                    <View style={styles.details}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Monto:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(amount)}</Text>
                        </View>

                        {recipientName && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Para:</Text>
                                <Text style={styles.detailValue}>{recipientName}</Text>
                            </View>
                        )}
                    </View>

                    {/* Warning */}
                    <View style={styles.warningContainer}>
                        <Ionicons name="information-circle" size={20} color={BrandColors.warning} />
                        <Text style={styles.warningText}>
                            Esta acción no se puede deshacer
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title="Confirmar Pago"
                            onPress={onConfirm}
                            loading={loading}
                            disabled={loading}
                        />
                        <Button
                            title="Cancelar"
                            onPress={onCancel}
                            variant="outline"
                            disabled={loading}
                        />
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
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: BrandColors.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        gap: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
    },
    details: {
        gap: 16,
        paddingVertical: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#fef3c7', // Light warning background
        borderRadius: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.warning,
    },
    actions: {
        gap: 12,
    },
});
