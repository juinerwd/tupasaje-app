import { GeneratePaymentQRModal } from '@/components/GeneratePaymentQRModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { Card, ProgressBar, Skeleton } from '@/components/ui';
import ButtonAction from '@/components/ui/ButtonAction';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { BrandColors } from '@/constants/theme';
import { useConductorStatistics, useConductorTransactions, useDriverProfile, useUpdateDriverStatus } from '@/hooks/useConductor';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useProfileCompleteness } from '@/hooks/useProfile';
import { useWalletDetails } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/authStore';
import { Transaction, TransactionStatus, TransactionType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ConductorDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [qrPaymentVisible, setQrPaymentVisible] = useState(false);
    const [myQrVisible, setMyQrVisible] = useState(false);
    const [withdrawalVisible, setWithdrawalVisible] = useState(false);

    const {
        data: stats,
        isLoading: isLoadingStats,
        refetch: refetchStats,
    } = useConductorStatistics();

    const {
        data: transactionsData,
        isLoading: isLoadingTransactions,
        refetch: refetchTransactions,
    } = useConductorTransactions({ limit: 20 });

    const {
        data: notificationData,
        refetch: refetchNotifications
    } = useUnreadNotificationsCount();

    const {
        data: completenessData,
        isLoading: isLoadingCompleteness,
        refetch: refetchCompleteness
    } = useProfileCompleteness();

    const {
        data: driverProfile,
        isLoading: isLoadingProfile,
        refetch: refetchProfile
    } = useDriverProfile();

    const {
        data: walletData,
        isLoading: isLoadingWallet
    } = useWalletDetails();

    const updateStatusMutation = useUpdateDriverStatus();

    const unreadCount = notificationData?.unreadCount || 0;

    const handleEmergency = () => {
        Alert.alert(
            '¡EMERGENCIA!',
            '¿Deseas activar el protocolo de emergencia y contactar a las autoridades?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'SÍ, LLAMAR',
                    style: 'destructive',
                    onPress: () => {
                        Linking.openURL('tel:123').catch(err => {
                            console.error('Error opening dialer:', err);
                            Alert.alert('Error', 'No se pudo abrir el marcador telefónico.');
                        });
                    }
                }
            ]
        );
    };

    const fetchDashboardData = useCallback(async () => {
        await Promise.all([
            refetchStats(),
            refetchTransactions(),
            refetchNotifications(),
            refetchCompleteness(),
            refetchProfile(),
        ]);
    }, [refetchStats, refetchTransactions, refetchNotifications, refetchCompleteness, refetchProfile]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    const recentTransactions = useMemo(() => transactionsData?.rides?.slice(0, 5) || [], [transactionsData?.rides]);

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

    const weeklyEarnings = useMemo(() => {
        if (!transactionsData?.rides) return [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const earnings = new Array(7).fill(0);
        const now = new Date();

        transactionsData.rides.forEach((tx: Transaction) => {
            const txDate = new Date(tx.createdAt);
            const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                const dayIndex = txDate.getDay();
                earnings[dayIndex] += Math.abs(parseFloat(tx.amount));
            }
        });

        const todayIndex = now.getDay();
        const orderedEarnings = [];
        for (let i = 0; i < 7; i++) {
            const index = (todayIndex - 6 + i + 7) % 7;
            orderedEarnings.push({
                day: days[index],
                amount: earnings[index],
            });
        }
        return orderedEarnings;
    }, [transactionsData?.rides]);

    const maxEarnings = useMemo(() => Math.max(...weeklyEarnings.map(s => s.amount), 1000), [weeklyEarnings]);

    const notificationPulse = useSharedValue(1);

    React.useEffect(() => {
        notificationPulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const notificationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: notificationPulse.value }],
    }));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BrandColors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={styles.greeting}>¡Hola!</Text>
                        <View style={styles.userNameContainer}>
                            <Text style={styles.userName} numberOfLines={1}>{user?.firstName || 'Conductor'}</Text>
                            {user?.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="shield-checkmark" size={14} color={BrandColors.white} />
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={() => router.push('/conductor/notifications' as any)}
                        >
                            <View style={styles.iconBadgeContainer}>
                                <Ionicons name="notifications-outline" size={26} color={BrandColors.gray[900]} />
                                {unreadCount > 0 && (
                                    <Animated.View style={[styles.badge, notificationStyle]}>
                                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                    </Animated.View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Completeness Card */}
                {completenessData && !completenessData.completed && (
                    <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                        <Card variant="elevated" style={styles.completenessCard}>
                            <View style={styles.completenessHeader}>
                                <View style={styles.completenessIconContainer}>
                                    <Ionicons name="person-circle" size={24} color={BrandColors.primary} />
                                </View>
                                <View style={styles.completenessInfo}>
                                    <Text style={styles.completenessTitle}>Completa tu perfil</Text>
                                    <Text style={styles.completenessSubtitle}>
                                        {completenessData.missing.length > 0
                                            ? `Te falta: ${completenessData.missing.join(', ')}`
                                            : 'Casi listo para verificar tu cuenta'}
                                    </Text>
                                </View>
                                <Text style={styles.completenessPercentage}>{completenessData.completeness}%</Text>
                            </View>
                            <ProgressBar
                                progress={completenessData.completeness / 100}
                                color={BrandColors.primary}
                                style={styles.completenessBar}
                            />
                            <TouchableOpacity
                                style={styles.completenessButton}
                                onPress={() => router.push('/conductor/edit-profile' as any)}
                            >
                                <Text style={styles.completenessButtonText}>Completar ahora</Text>
                                <Ionicons name="arrow-forward" size={16} color={BrandColors.primary} />
                            </TouchableOpacity>
                        </Card>
                    </Animated.View>
                )}

                {/* Earnings Card */}
                <Animated.View entering={FadeInUp.duration(600).springify()}>
                    <LinearGradient
                        colors={[BrandColors.primary, '#2E7D32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.earningsCard}
                    >
                        <View style={styles.earningsHeader}>
                            <View>
                                <Text style={styles.earningsLabel}>Saldo Disponible</Text>
                                {isLoadingStats ? (
                                    <Skeleton width={150} height={40} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                                ) : (
                                    <Text style={styles.earningsAmount}>
                                        {formatCurrency(stats?.availableBalance || 0)}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.earningsIconContainer}>
                                <TouchableOpacity
                                    style={styles.withdrawButtonHeader}
                                    onPress={() => setWithdrawalVisible(true)}
                                >
                                    <Text style={styles.withdrawButtonText}>Retirar</Text>
                                    <Ionicons name="arrow-forward" size={14} color={BrandColors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.earningsFooter}>
                            <View style={styles.earningsStat}>
                                <Text style={styles.statSubLabel}>Total Recibido</Text>
                                <Text style={styles.statSubValue}>
                                    {formatCurrency(stats?.totalEarnings || 0)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.earningsStat}>
                                <Text style={styles.statSubLabel}>Retiros</Text>
                                <Text style={styles.statSubValue}>
                                    {formatCurrency(stats?.totalWithdrawals || 0)}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                    <View style={styles.actionsGrid}>
                        {[
                            { id: 'receive', title: 'Recibir Pago', icon: 'qr-code', color: '#4CAF50', action: () => setQrPaymentVisible(true) },
                            { id: 'withdraw', title: 'Retirar', icon: 'cash', color: '#FF9800', action: () => setWithdrawalVisible(true) },
                            { id: 'history', title: 'Historial', icon: 'receipt', color: '#2196F3', action: () => router.push('/conductor/transactions' as any) },
                            { id: 'my-qr', title: 'Mi QR', icon: 'person', color: '#9C27B0', action: () => setMyQrVisible(true) },
                            { id: 'support', title: 'Soporte', icon: 'help-buoy', color: '#607D8B', action: () => router.push('/conductor/help' as any) },
                            { id: 'emergency', title: 'Emergencia', icon: 'alert-circle', color: '#F44336', action: handleEmergency },
                        ].map((action, index) => (
                            <ButtonAction
                                key={action.id}
                                action={action}
                                index={index}
                            />
                        ))}
                    </View>
                </View>

                {/* Weekly Earnings Chart */}
                <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                    <Card variant="elevated" style={styles.chartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTitle}>Ingresos últimos 7 días</Text>
                            <View style={styles.chartLegend}>
                                <View style={[styles.legendDot, { backgroundColor: BrandColors.primary }]} />
                                <Text style={styles.legendText}>Ganancias</Text>
                            </View>
                        </View>
                        <View style={styles.chartContainer}>
                            {isLoadingTransactions ? (
                                <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <Skeleton key={i} width="10%" height={`${Math.random() * 60 + 20}%`} style={{ borderRadius: 10 }} />
                                    ))}
                                </View>
                            ) : (
                                weeklyEarnings.map((data, index) => (
                                    <View key={index} style={styles.chartColumn}>
                                        <View style={styles.barContainer}>
                                            <Animated.View
                                                entering={FadeInUp.delay(400 + index * 50).duration(600)}
                                                style={[
                                                    styles.bar,
                                                    {
                                                        height: `${(data.amount / maxEarnings) * 100}%`,
                                                        backgroundColor: data.amount === maxEarnings ? BrandColors.primary : BrandColors.primary + '80'
                                                    }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.barLabel}>{data.day}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </Card>
                </Animated.View>

                {/* Vehicle & Route Info */}
                <Animated.View entering={FadeInDown.delay(350).duration(600)}>
                    <Card variant="elevated" style={styles.vehicleCard}>
                        <View style={styles.vehicleHeader}>
                            <View style={styles.vehicleIconContainer}>
                                <Ionicons name="bus" size={24} color={BrandColors.primary} />
                            </View>
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleLabel}>Vehículo Asignado</Text>
                                <Text style={styles.vehiclePlate}>{driverProfile?.vehiclePlate || 'Sin vehículo'}</Text>
                            </View>
                            {driverProfile?.vehiclePlate && (
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>Activo</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.routeDivider} />
                        <View style={styles.routeInfo}>
                            <Ionicons name="navigate-circle-outline" size={20} color={BrandColors.gray[400]} />
                            <Text style={styles.routeLabel}>Ruta Actual:</Text>
                            <Text style={styles.routeName}>{driverProfile?.currentRoute || 'Ninguna ruta activa'}</Text>
                        </View>
                    </Card>
                </Animated.View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Animated.View
                        entering={FadeInLeft.delay(700).duration(600).springify()}
                        style={styles.statCardWrapper}
                    >
                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="calendar" size={20} color="#1976D2" />
                            </View>
                            <Text style={styles.gridStatLabel}>Esta semana</Text>
                            {isLoadingTransactions ? (
                                <Skeleton width={60} height={20} />
                            ) : (
                                <Text style={styles.gridStatValue}>
                                    {formatCurrency(weeklyEarnings.reduce((acc, curr) => acc + curr.amount, 0))}
                                </Text>
                            )}
                        </Card>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInRight.delay(800).duration(600).springify()}
                        style={styles.statCardWrapper}
                    >
                        <Card variant="elevated" style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
                                <Ionicons name="star" size={20} color="#7B1FA2" />
                            </View>
                            <Text style={styles.gridStatLabel}>Calificación</Text>
                            {isLoadingStats ? (
                                <Skeleton width={40} height={20} />
                            ) : (
                                <Text style={styles.gridStatValue}>{stats?.averageRating?.toFixed(1) || '0.0'}</Text>
                            )}
                        </Card>
                    </Animated.View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Transacciones recientes</Text>
                        <TouchableOpacity onPress={() => router.push('/conductor/transactions')}>
                            <Text style={styles.seeAllText}>Ver todas</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingTransactions ? (
                        [1, 2, 3].map((i) => (
                            <Skeleton key={i} height={70} style={{ marginBottom: 12, borderRadius: 16 }} />
                        ))
                    ) : recentTransactions.length > 0 ? (
                        recentTransactions.map((tx: Transaction, index: number) => {
                            const isWithdrawal = tx.type === TransactionType.WITHDRAWAL || (tx.type === TransactionType.TRANSFER && tx.fromUserId === user?.id);
                            const amount = parseFloat(tx.amount);

                            return (
                                <Animated.View
                                    key={tx.id}
                                    entering={FadeInUp.delay(800 + index * 100).duration(500)}
                                >
                                    <Card variant="elevated" style={styles.transactionItem}>
                                        <LinearGradient
                                            colors={
                                                isWithdrawal
                                                    ? [BrandColors.warning + '20', BrandColors.warning + '05']
                                                    : [BrandColors.success + '20', BrandColors.success + '05']
                                            }
                                            style={styles.txIconContainer}
                                        >
                                            <Ionicons
                                                name={isWithdrawal ? "arrow-up-circle" : "arrow-down-circle"}
                                                size={24}
                                                color={isWithdrawal ? BrandColors.warning : BrandColors.success}
                                            />
                                        </LinearGradient>
                                        <View style={styles.txInfo}>
                                            <Text style={styles.txTitle}>
                                                {isWithdrawal ? 'Retiro de fondos' : 'Pago recibido'}
                                            </Text>
                                            <Text style={styles.txDate}>
                                                {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <View style={styles.txAmountContainer}>
                                            <Text style={[styles.txAmount, isWithdrawal && { color: BrandColors.warning }]}>
                                                {isWithdrawal ? '-' : '+'}{formatCurrency(Math.abs(amount))}
                                            </Text>
                                            <View style={[styles.txStatusBadge, { backgroundColor: getStatusInfo(tx.status).bg }]}>
                                                <Text style={[styles.txStatusText, { color: getStatusInfo(tx.status).color }]}>
                                                    {getStatusInfo(tx.status).label}
                                                </Text>
                                            </View>
                                        </View>
                                    </Card>
                                </Animated.View>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={BrandColors.gray[300]} />
                            <Text style={styles.emptyText}>No hay transacciones hoy</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modals */}
            <GeneratePaymentQRModal
                visible={qrPaymentVisible}
                onClose={() => setQrPaymentVisible(false)}
                walletId={walletData?.id.toString() || ''}
            />

            <QRCodeModal
                visible={myQrVisible}
                onClose={() => setMyQrVisible(false)}
                username={user?.username || ''}
                userName={user?.fullName}
            />

            <WithdrawalModal
                visible={withdrawalVisible}
                onClose={() => setWithdrawalVisible(false)}
                availableBalance={stats?.availableBalance || 0}
                navigationRouter={() => router.push('/conductor/withdrawal-methods')}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: BrandColors.gray[500],
        fontWeight: '500',
    },
    userNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    verifiedBadge: {
        backgroundColor: BrandColors.primary,
        borderRadius: 6,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BrandColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BrandColors.gray[100],
    },
    iconBadgeContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: BrandColors.error,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: BrandColors.white,
    },
    badgeText: {
        color: BrandColors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    completenessCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: BrandColors.primary,
    },
    completenessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    completenessIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BrandColors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    completenessInfo: {
        flex: 1,
    },
    completenessTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    completenessSubtitle: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    completenessPercentage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    completenessBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 12,
    },
    completenessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    completenessButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.primary,
    },
    earningsCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
    },
    earningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    earningsLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: 4,
    },
    earningsAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    earningsIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawButtonHeader: {
        backgroundColor: BrandColors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    withdrawButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    earningsFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 16,
        marginHorizontal: -24,
        marginBottom: -24,
    },
    earningsStat: {
        flex: 1,
        alignItems: 'center',
    },
    statSubLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 2,
    },
    statSubValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    chartCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    chartLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    chartContainer: {
        flexDirection: 'row',
        height: 150,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingTop: 10,
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barContainer: {
        flex: 1,
        width: '60%',
        backgroundColor: BrandColors.gray[50],
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 10,
    },
    barLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: BrandColors.gray[500],
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCardWrapper: {
        flex: 1,
    },
    statCard: {
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridStatLabel: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginBottom: 4,
    },
    gridStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    seeAllText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
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
        backgroundColor: BrandColors.success + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    txStatusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: BrandColors.success,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: BrandColors.white,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: BrandColors.gray[100],
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: BrandColors.gray[400],
    },
    vehicleCard: {
        padding: 16,
        marginBottom: 24,
    },
    vehicleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: BrandColors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleLabel: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginBottom: 2,
    },
    vehiclePlate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.success + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BrandColors.success,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: BrandColors.success,
    },
    routeDivider: {
        height: 1,
        backgroundColor: BrandColors.gray[100],
        marginVertical: 12,
    },
    routeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeLabel: {
        fontSize: 13,
        color: BrandColors.gray[500],
    },
    routeName: {
        fontSize: 13,
        fontWeight: '600',
        color: BrandColors.primary,
    },
});
