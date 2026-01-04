import { RechargeModal } from '@/components/RechargeModal';
import { RechargeSuccessModal } from '@/components/RechargeSuccessModal';
import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useWalletTransactions } from '@/hooks/useRecharge';
import * as walletService from '@/services/walletService';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedCard = Animated.createAnimatedComponent(Card);

export default function WalletScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastRechargeAmount, setLastRechargeAmount] = useState(0);
    const [balance, setBalance] = useState<{ balance: string; currency: string } | null>(null);

    const { data: transactions, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useWalletTransactions();

    const fetchBalance = useCallback(async () => {
        try {
            const data = await walletService.getBalance();
            setBalance(data);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }, []);

    React.useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchBalance(), refetchTransactions()]);
        setRefreshing(false);
    }, [fetchBalance, refetchTransactions]);

    const handleRechargeSuccess = () => {
        // This is called when the recharge is initiated
        // In test mode, we might want to show success immediately
        // In production, we wait for the webhook
        fetchBalance();
        refetchTransactions();
    };

    const renderTransaction = ({ item, index }: { item: Transaction; index: number }) => {
        const isIncoming =
            item.type === TransactionType.RECHARGE || item.type === TransactionType.REFUND;
        const amount = parseFloat(item.amount);
        const date = new Date(item.createdAt);
        const formattedDate = date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
        });

        const getStatusColor = () => {
            switch (item.status) {
                case 'COMPLETED': return BrandColors.success;
                case 'PENDING': return BrandColors.warning;
                case 'FAILED': return BrandColors.error;
                default: return BrandColors.gray[500];
            }
        };

        return (
            <AnimatedCard
                entering={FadeInRight.delay(index * 50).duration(400).springify()}
                style={styles.transactionCard}
            >
                <View style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: isIncoming ? '#e8f5e9' : '#ffebee' }]}>
                            <Ionicons
                                name={isIncoming ? 'arrow-down' : 'arrow-up'}
                                size={20}
                                color={isIncoming ? BrandColors.success : BrandColors.error}
                            />
                        </View>
                        <View>
                            <Text style={styles.transactionType}>{item.type}</Text>
                            <Text style={styles.transactionDate}>{formattedDate}</Text>
                        </View>
                    </View>
                    <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: isIncoming ? BrandColors.success : BrandColors.error }]}>
                            {isIncoming ? '+' : '-'}{formatCurrency(Math.abs(amount))}
                        </Text>
                        <Text style={[styles.transactionStatus, { color: getStatusColor() }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[BrandColors.primary, BrandColors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mi Billetera</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                    <Text style={styles.balanceAmount}>
                        {balance ? formatCurrency(parseFloat(balance.balance)) : '$0.00'}
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowRechargeModal(true)}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="add" size={24} color={BrandColors.primary} />
                        </View>
                        <Text style={styles.actionText}>Recargar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/(passenger)/qr-payment')}
                    >
                        <View style={styles.actionIcon}>
                            <Ionicons name="qr-code" size={24} color={BrandColors.primary} />
                        </View>
                        <Text style={styles.actionText}>Pagar con QR</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
                    <TouchableOpacity onPress={() => router.push('/(passenger)/transactions')}>
                        <Text style={styles.seeAll}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {isLoadingTransactions ? (
                    <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={transactions?.slice(0, 10)}
                        renderItem={renderTransaction}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={48} color={BrandColors.gray[400]} />
                                <Text style={styles.emptyText}>No hay transacciones aún</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <RechargeModal
                visible={showRechargeModal}
                onClose={() => setShowRechargeModal(false)}
                onSuccess={handleRechargeSuccess}
            />

            <RechargeSuccessModal
                visible={showSuccessModal}
                amount={lastRechargeAmount}
                onClose={() => setShowSuccessModal(false)}
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
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    balanceContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 5,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 30,
        marginTop: 10,
    },
    actionButton: {
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: BrandColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: BrandColors.white,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    seeAll: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    transactionCard: {
        padding: 15,
        marginBottom: 10,
    },
    transactionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionType: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    transactionDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionStatus: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
});
