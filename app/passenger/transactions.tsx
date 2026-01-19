import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as walletService from '@/services/walletService';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedCard = Animated.createAnimatedComponent(Card);

export default function PassengerTransactions() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await walletService.getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTransactions();
        setRefreshing(false);
    }, [fetchTransactions]);

    const handleTransactionPress = (item: Transaction) => {
        if (item.type === TransactionType.RECHARGE) {
            router.push({
                pathname: '/shared/recharge-receipt',
                params: {
                    transactionId: item.id,
                    reference: item.reference || 'N/A',
                    amount: item.amount,
                    paymentMethod: 'Recarga'
                }
            });
        } else {
            router.push({
                pathname: '/shared/payment-receipt',
                params: {
                    transactionId: item.id,
                    reference: item.reference || 'N/A',
                    amount: item.amount,
                    conductorUsername: item.toUser?.username || 'conductor',
                    passengerUsername: item.fromUser?.username || 'usuario',
                    createdAt: item.createdAt,
                    status: item.status
                }
            });
        }
    };

    const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => {
        const isIncoming =
            item.type === TransactionType.RECHARGE || item.type === TransactionType.REFUND;
        const amount = parseFloat(item.amount);
        const formattedDate = new Date(item.createdAt).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        const formattedTime = new Date(item.createdAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const getStatusColor = () => {
            switch (item.status) {
                case 'COMPLETED':
                    return BrandColors.success;
                case 'PENDING':
                    return BrandColors.warning;
                case 'FAILED':
                    return BrandColors.error;
                case 'CANCELLED':
                    return BrandColors.gray[500];
                default:
                    return BrandColors.gray[500];
            }
        };

        const getStatusText = () => {
            switch (item.status) {
                case 'COMPLETED':
                    return 'Completado';
                case 'PENDING':
                    return 'Pendiente';
                case 'FAILED':
                    return 'Fallido';
                case 'CANCELLED':
                    return 'Cancelado';
                default:
                    return item.status;
            }
        };

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleTransactionPress(item)}
            >
                <AnimatedCard
                    entering={FadeInRight.delay(index * 50).duration(400).springify()}
                    variant="outlined"
                    style={styles.transactionCard}
                >
                    <View style={styles.transactionContent}>
                        <View style={styles.transactionLeft}>
                            <LinearGradient
                                colors={isIncoming ? ['#d1fae5', '#a7f3d0'] : ['#fee2e2', '#fecaca']}
                                style={styles.transactionIcon}
                            >
                                <Ionicons
                                    name={isIncoming ? 'arrow-down' : 'arrow-up'}
                                    size={20}
                                    color={isIncoming ? BrandColors.success : BrandColors.error}
                                />
                            </LinearGradient>
                            <View style={styles.transactionInfo}>
                                <Text style={styles.transactionType}>{item.type}</Text>
                                <Text style={styles.transactionDescription}>
                                    {item.description || 'Sin descripción'}
                                </Text>
                                <View style={styles.transactionMeta}>
                                    <Text style={styles.transactionDate}>{formattedDate}</Text>
                                    <Text style={styles.transactionTime}> • {formattedTime}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.transactionRight}>
                            <Text
                                style={[
                                    styles.transactionAmount,
                                    isIncoming
                                        ? styles.transactionAmountPositive
                                        : styles.transactionAmountNegative,
                                ]}
                            >
                                {isIncoming ? '+' : '-'}
                                {formatCurrency(Math.abs(amount))}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
                                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                    {getStatusText()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </AnimatedCard>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={BrandColors.gray[400]} />
            <Text style={styles.emptyTitle}>No hay transacciones</Text>
            <Text style={styles.emptyText}>Tus transacciones aparecerán aquí</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View
                entering={FadeInDown.duration(500).springify()}
                style={styles.header}
            >
                <Text style={styles.title}>Historial de Transacciones</Text>
                <Text style={styles.subtitle}>
                    {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
                </Text>
            </Animated.View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={BrandColors.primary}
                            colors={[BrandColors.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    transactionCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
    },
    transactionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    transactionDescription: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginBottom: 4,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    transactionTime: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    transactionAmountPositive: {
        color: BrandColors.success,
    },
    transactionAmountNegative: {
        color: BrandColors.error,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[700],
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
});
