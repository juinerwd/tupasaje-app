import { Card } from '@/components/ui/Card';
import { BrandColors } from '@/constants/theme';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TransactionItemProps {
    transaction: Transaction;
    currentUserId?: string;
}

const getStatusInfo = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.COMPLETED:
            return { label: 'Completado', color: BrandColors.success, bg: BrandColors.success + '10' };
        case TransactionStatus.PENDING:
            return { label: 'Pendiente', color: BrandColors.warning, bg: BrandColors.warning + '10' };
        case TransactionStatus.FAILED:
            return { label: 'Fallido', color: BrandColors.error, bg: BrandColors.error + '10' };
        case TransactionStatus.CANCELLED:
            return { label: 'Cancelado', color: BrandColors.gray[500], bg: BrandColors.gray[100] };
        default:
            return { label: status, color: BrandColors.gray[500], bg: BrandColors.gray[100] };
    }
};

export function TransactionItem({ transaction: tx, currentUserId }: TransactionItemProps) {
    const userIdStr = currentUserId?.toString();
    
    // Unificar lógica de "salida" vs "entrada" de dinero
    const isOutgoing = 
        tx.type === TransactionType.WITHDRAWAL || 
        tx.type === TransactionType.PAYMENT ||
        (tx.type === TransactionType.TRANSFER && tx.fromUserId?.toString() === userIdStr);

    const amount = parseFloat(tx.amount);
    const statusInfo = getStatusInfo(tx.status);

    // Determinar ícono y título según el tipo
    const getTransactionUI = () => {
        switch (tx.type) {
            case TransactionType.RECHARGE:
                return { title: 'Recarga', icon: 'add-circle', color: BrandColors.success };
            case TransactionType.PAYMENT:
                return { title: 'Pago de pasaje', icon: 'bus', color: BrandColors.error };
            case TransactionType.WITHDRAWAL:
                return { title: 'Retiro de fondos', icon: 'arrow-up-circle', color: BrandColors.warning };
            case TransactionType.TRANSFER:
                return isOutgoing 
                    ? { title: 'Transferencia enviada', icon: 'arrow-forward-circle', color: BrandColors.error }
                    : { title: 'Transferencia recibida', icon: 'arrow-back-circle', color: BrandColors.success };
            case TransactionType.REFUND:
                return { title: 'Reembolso', icon: 'reload-circle', color: BrandColors.success };
            default:
                return { title: tx.type, icon: 'receipt', color: BrandColors.gray[500] };
        }
    };

    const ui = getTransactionUI();

    return (
        <Card variant="elevated" style={styles.transactionItem}>
            <LinearGradient
                colors={[ui.color + '20', ui.color + '05']}
                style={styles.txIconContainer}
            >
                <Ionicons
                    name={ui.icon as any}
                    size={24}
                    color={ui.color}
                />
            </LinearGradient>
            <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{ui.title}</Text>
                <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={styles.txAmountContainer}>
                <Text style={[styles.txAmount, { color: isOutgoing ? BrandColors.error : BrandColors.success }]}>
                    {isOutgoing ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                </Text>
                <View style={[styles.txStatusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.txStatusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    txIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    txDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginTop: 2,
    },
    txAmountContainer: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.success,
    },
    txStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 4,
    },
    txStatusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
