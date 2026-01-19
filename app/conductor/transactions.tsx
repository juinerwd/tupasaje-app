import { Card, Skeleton } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useConductorTransactions } from '@/hooks/useConductor';
import { useAuthStore } from '@/store/authStore';
import { Transaction, TransactionStatus, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConductorTransactions() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const {
        data: transactionsData,
        isLoading,
        refetch,
        isRefetching
    } = useConductorTransactions();

    const transactions = transactionsData?.rides || [];

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toString().includes(searchQuery)
    );

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

    const handleTransactionPress = (item: Transaction) => {
        router.push({
            pathname: '/shared/payment-receipt',
            params: {
                transactionId: item.id,
                reference: item.reference || 'N/A',
                amount: item.amount,
                fee: item.fee,
                netAmount: item.netAmount,
                conductorUsername: item.toUser?.username || user?.username || 'conductor',
                passengerUsername: item.fromUser?.username || 'usuario',
                createdAt: item.createdAt,
                status: item.status
            }
        });
    };

    const renderTransaction = ({ item, index }: { item: Transaction, index: number }) => {
        const isWithdrawal = item.type === TransactionType.WITHDRAWAL || (item.type === TransactionType.TRANSFER && item.fromUserId === user?.id);
        const amount = parseFloat(item.amount);
        const isReceived = item.toUserId === user?.id;

        return (
            <Animated.View entering={FadeInUp.delay(index * 50).duration(400)}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleTransactionPress(item)}
                >
                    <Card variant="elevated" style={styles.transactionCard}>
                        <View style={[
                            styles.txIconContainer,
                            !isReceived && { backgroundColor: BrandColors.warning + '10' }
                        ]}>
                            <Ionicons
                                name={!isReceived ? "arrow-up-circle" : "arrow-down-circle"}
                                size={24}
                                color={!isReceived ? BrandColors.warning : BrandColors.success}
                            />
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={styles.txTitle}>
                                {item.type === TransactionType.WITHDRAWAL ? 'Retiro de fondos' :
                                    !isReceived ? 'Transferencia enviada' : 'Pago de Pasaje'}
                            </Text>
                            <Text style={styles.txDate}>
                                {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={styles.txAmountContainer}>
                            <Text style={[styles.txAmount, !isReceived && { color: BrandColors.warning }]}>
                                {!isReceived ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusInfo(item.status).bg }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: getStatusInfo(item.status).color }
                                ]}>
                                    {getStatusInfo(item.status).label}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color={BrandColors.gray[400]} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar transacciones..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={BrandColors.gray[400]}
                    />
                </View>
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BrandColors.primary} />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={64} color={BrandColors.gray[200]} />
                            <Text style={styles.emptyTitle}>No hay transacciones</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'Tus pagos recibidos aparecerán aquí.'}
                            </Text>
                        </View>
                    )
                }
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: BrandColors.white,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    searchContainer: {
        padding: 20,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[50],
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: BrandColors.gray[900],
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    txIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BrandColors.success + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    txDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    txAmountContainer: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.success,
        marginBottom: 4,
    },
    statusBadge: {
        backgroundColor: BrandColors.success + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: BrandColors.success,
        textTransform: 'uppercase',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: BrandColors.gray[500],
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
