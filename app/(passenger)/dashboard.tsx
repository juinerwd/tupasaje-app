import { QRCodeModal } from '@/components/QRCodeModal';
import { RechargeModal } from '@/components/RechargeModal';
import { RechargeSuccessModal } from '@/components/RechargeSuccessModal';
import { Card, ProgressBar } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as notificationService from '@/services/notificationService';
import * as passengerService from '@/services/passengerService';
import * as walletService from '@/services/walletService';
import { useAuthStore } from '@/store/authStore';
import { PassengerProfile, Transaction, TransactionType, WalletBalance } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function PassengerDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // State for API data
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Modals state
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [lastRechargeAmount, setLastRechargeAmount] = useState(0);

    // Animated values
    const notificationPulse = useSharedValue(1);
    const balanceShimmer = useSharedValue(0);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch data individually to catch specific errors
            const balanceData = await walletService.getBalance().catch(err => {
                console.error('Error fetching balance:', err);
                return null;
            });

            const transactionsData = await walletService.getTransactions().catch(err => {
                console.error('Error fetching transactions:', err);
                return [];
            });

            const notificationData = await notificationService.getUnreadCount().catch(err => {
                console.error('Error fetching notifications:', err);
                return { unreadCount: 0 };
            });

            const passengerData = await passengerService.getProfile().catch(err => {
                console.error('Error fetching passenger profile:', err);
                return null;
            });

            setBalance(balanceData);
            setPassengerProfile(passengerData);
            // Get only the 3 most recent transactions
            setRecentTransactions(transactionsData.slice(0, 3));
            setUnreadCount(notificationData.unreadCount);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Notification pulse animation
    useEffect(() => {
        notificationPulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            false
        );

        // Shimmer effect for balance
        balanceShimmer.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    const notificationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: notificationPulse.value }],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: 0.6 + balanceShimmer.value * 0.4,
    }));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    const handleActionPress = (action: string) => {
        // Add haptic feedback if available
        if (action === 'recharge') {
            setRechargeModalVisible(true);
        } else if (action === 'pay') {
            router.push('/(passenger)/qr-payment');
        } else if (action === 'emergency') {
            router.push('/(passenger)/emergency-code' as any);
        }
    };

    const handleRechargeSuccess = () => {
        // In test mode, we might want to show success immediately
        // For now, just refresh the dashboard data
        fetchDashboardData();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={BrandColors.primary}
                        colors={[BrandColors.primary]}
                    />
                }
            >
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.duration(600).springify()}
                    style={styles.header}
                >
                    <View>
                        <Text style={styles.greeting}>¡Hola!</Text>
                        <Text style={styles.userName}>{user?.firstName || 'Usuario'}</Text>
                        {user?.username && (
                            <View style={styles.usernameContainer}>
                                <Ionicons name="at" size={14} color={BrandColors.primary} />
                                <Text style={styles.usernameText}>{user.username}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color={BrandColors.success} />
                                </View>
                            </View>
                        )}
                    </View>
                    <AnimatedTouchable
                        style={[styles.notificationButton, notificationStyle]}
                        onPress={() => router.push('/(passenger)/notifications')}
                    >
                        <View style={styles.notificationBadge}>
                            <Ionicons name="notifications" size={24} color={BrandColors.gray[700]} />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </AnimatedTouchable>
                </Animated.View>

                {/* Balance Card with Gradient */}
                <AnimatedLinearGradient
                    colors={[BrandColors.primary, BrandColors.primaryDark, '#014d1e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    entering={FadeInUp.delay(200).duration(700).springify()}
                    style={styles.balanceCard}
                >
                    <Text style={styles.balanceLabel}>Saldo disponible</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={BrandColors.white} style={{ marginBottom: 28 }} />
                    ) : balance ? (
                        <Text style={styles.balanceAmount}>
                            {formatCurrency(parseFloat(balance.balance || '0'))}
                        </Text>
                    ) : (
                        <View style={styles.noWalletContainer}>
                            <Text style={styles.noWalletText}>Wallet no disponible</Text>
                            <Text style={styles.noWalletSubtext}>Contacta con soporte</Text>
                        </View>
                    )}

                    <View style={styles.balanceActions}>
                        <AnimatedTouchable
                            entering={FadeInLeft.delay(400).duration(600).springify()}
                            style={styles.balanceActionButton}
                            onPress={() => handleActionPress('recharge')}
                            disabled={!balance}
                        >
                            <View style={styles.actionIconContainer}>
                                <LinearGradient
                                    colors={['#ffffff', '#f0f0f0']}
                                    style={styles.actionIconGradient}
                                >
                                    <Ionicons name="add-circle" size={28} color={BrandColors.primary} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.actionText}>Recargar</Text>
                        </AnimatedTouchable>

                        <AnimatedTouchable
                            entering={FadeInRight.delay(500).duration(600).springify()}
                            style={styles.balanceActionButton}
                            onPress={() => handleActionPress('pay')}
                            disabled={!balance}
                        >
                            <View style={styles.actionIconContainer}>
                                <LinearGradient
                                    colors={['#ffffff', '#f0f0f0']}
                                    style={styles.actionIconGradient}
                                >
                                    <Ionicons name="qr-code" size={28} color={BrandColors.primary} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.actionText}>Pagar</Text>
                        </AnimatedTouchable>
                    </View>

                    {/* Decorative circles */}
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                </AnimatedLinearGradient>

                {/* Profile Completeness */}
                {user && user.profileCompleteness < 100 && (
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600).springify()}
                        style={styles.completenessSection}
                    >
                        <Card variant="elevated" style={styles.completenessCard}>
                            <View style={styles.completenessHeader}>
                                <View>
                                    <Text style={styles.completenessTitle}>Completa tu perfil</Text>
                                    <Text style={styles.completenessSubtitle}>
                                        {user.profileCompleteness}% completado
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/(passenger)/edit-profile')}
                                    style={styles.completeButton}
                                >
                                    <Text style={styles.completeButtonText}>Completar</Text>
                                    <Ionicons name="arrow-forward" size={16} color={BrandColors.primary} />
                                </TouchableOpacity>
                            </View>
                            <ProgressBar
                                progress={user.profileCompleteness / 100}
                                color={BrandColors.primary}
                                height={8}
                                style={styles.progressBar}
                            />
                        </Card>
                    </Animated.View>
                )}

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <Animated.View
                        entering={FadeInLeft.delay(400).duration(600).springify()}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.statGradient}
                        >
                            <Ionicons name="bus-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.statValue}>{passengerProfile?.totalTrips || 0}</Text>
                            <Text style={styles.statLabel}>Viajes</Text>
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(500).duration(600).springify()}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.statGradient}
                        >
                            <Ionicons name="wallet-outline" size={24} color={BrandColors.secondary} />
                            <Text style={styles.statValue}>
                                {formatCurrency(passengerProfile?.totalSpent || 0)}
                            </Text>
                            <Text style={styles.statLabel}>Gastado</Text>
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInRight.delay(600).duration(600).springify()}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.statGradient}
                        >
                            <Ionicons name="star-outline" size={24} color={BrandColors.warning} />
                            <Text style={styles.statValue}>
                                {passengerProfile?.averageRating?.toFixed(1) || '0.0'}
                            </Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Animated.Text
                        entering={FadeInLeft.delay(600).duration(500)}
                        style={styles.sectionTitle}
                    >
                        Acciones rápidas
                    </Animated.Text>
                    <View style={styles.quickActions}>
                        <AnimatedTouchable
                            entering={FadeInUp.delay(700).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => router.push('/(passenger)/scan-qr' as any)}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9fa']}
                                style={styles.quickActionGradient}
                            >
                                <View style={styles.quickActionIconContainer}>
                                    <Ionicons name="qr-code-outline" size={32} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.quickActionText}>Escanear QR</Text>
                            </LinearGradient>
                        </AnimatedTouchable>

                        <AnimatedTouchable
                            entering={FadeInUp.delay(800).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => router.push('/(passenger)/transactions')}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9fa']}
                                style={styles.quickActionGradient}
                            >
                                <View style={styles.quickActionIconContainer}>
                                    <Ionicons name="time-outline" size={32} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.quickActionText}>Historial</Text>
                            </LinearGradient>
                        </AnimatedTouchable>

                        {user?.username ? (
                            <AnimatedTouchable
                                entering={FadeInUp.delay(900).duration(600).springify()}
                                style={styles.quickActionCard}
                                onPress={() => setQrModalVisible(true)}
                            >
                                <LinearGradient
                                    colors={['#e8f5e9', '#f1f8f4']}
                                    style={styles.quickActionGradient}
                                >
                                    <View style={[styles.quickActionIconContainer, styles.qrActionIcon]}>
                                        <Ionicons name="qr-code" size={32} color={BrandColors.primary} />
                                    </View>
                                    <Text style={styles.quickActionText}>Mi QR</Text>
                                </LinearGradient>
                            </AnimatedTouchable>
                        ) : (
                            <AnimatedTouchable
                                entering={FadeInUp.delay(900).duration(600).springify()}
                                style={styles.quickActionCard}
                            >
                                <LinearGradient
                                    colors={['#ffffff', '#f8f9fa']}
                                    style={styles.quickActionGradient}
                                >
                                    <View style={styles.quickActionIconContainer}>
                                        <Ionicons name="card-outline" size={32} color={BrandColors.primary} />
                                    </View>
                                    <Text style={styles.quickActionText}>Tarjetas</Text>
                                </LinearGradient>
                            </AnimatedTouchable>
                        )}

                        <AnimatedTouchable
                            entering={FadeInUp.delay(1000).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => router.push('/(passenger)/favorite-locations' as any)}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9fa']}
                                style={styles.quickActionGradient}
                            >
                                <View style={styles.quickActionIconContainer}>
                                    <Ionicons name="location-outline" size={32} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.quickActionText}>Ubicaciones</Text>
                            </LinearGradient>
                        </AnimatedTouchable>

                        <AnimatedTouchable
                            entering={FadeInUp.delay(1100).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => handleActionPress('emergency')}
                        >
                            <LinearGradient
                                colors={['#fff5f5', '#fff0f0']}
                                style={styles.quickActionGradient}
                            >
                                <View style={[styles.quickActionIconContainer, { backgroundColor: BrandColors.error + '15' }]}>
                                    <Ionicons name="alert-circle-outline" size={32} color={BrandColors.error} />
                                </View>
                                <Text style={[styles.quickActionText, { color: BrandColors.error }]}>Emergencia</Text>
                            </LinearGradient>
                        </AnimatedTouchable>
                    </View>
                </View>

                {/* Favorite Locations Horizontal List */}
                {passengerProfile?.favoriteLocations && passengerProfile.favoriteLocations.length > 0 && (
                    <View style={styles.section}>
                        <Animated.View
                            entering={FadeInLeft.delay(1150).duration(500)}
                            style={styles.sectionHeader}
                        >
                            <Text style={styles.sectionTitle}>Tus lugares</Text>
                            <TouchableOpacity onPress={() => router.push('/(passenger)/favorite-locations' as any)}>
                                <Text style={styles.seeAllText}>Ver todos</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.favoriteLocationsList}
                        >
                            {passengerProfile.favoriteLocations.map((location, index) => (
                                <AnimatedTouchable
                                    key={location.id}
                                    entering={FadeInRight.delay(1200 + index * 100).duration(600).springify()}
                                    style={styles.favoriteLocationCard}
                                >
                                    <View style={styles.favoriteLocationIcon}>
                                        <Ionicons name="location" size={20} color={BrandColors.primary} />
                                    </View>
                                    <Text style={styles.favoriteLocationName} numberOfLines={1}>
                                        {location.name}
                                    </Text>
                                </AnimatedTouchable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <Animated.View
                        entering={FadeInLeft.delay(1300).duration(500)}
                        style={styles.sectionHeader}
                    >
                        <Text style={styles.sectionTitle}>Transacciones recientes</Text>
                        <TouchableOpacity onPress={() => router.push('/(passenger)/transactions')}>
                            <Text style={styles.seeAllText}>Ver todas</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {loading ? (
                        <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginTop: 20 }} />
                    ) : recentTransactions.length === 0 ? (
                        <Text style={styles.emptyText}>No hay transacciones recientes</Text>
                    ) : (
                        recentTransactions.map((transaction, index) => {
                            const isIncoming = transaction.type === TransactionType.RECHARGE || transaction.type === TransactionType.REFUND;
                            const amount = parseFloat(transaction.amount);
                            const formattedDate = new Date(transaction.createdAt).toLocaleDateString('es-CO');

                            return (
                                <Animated.View
                                    key={transaction.id}
                                    entering={FadeInRight.delay(1400 + index * 100).duration(600).springify()}
                                >
                                    <Card variant="outlined" style={styles.transactionCard}>
                                        <View style={styles.transactionContent}>
                                            <View style={styles.transactionLeft}>
                                                <LinearGradient
                                                    colors={
                                                        isIncoming
                                                            ? ['#d1fae5', '#a7f3d0']
                                                            : ['#fee2e2', '#fecaca']
                                                    }
                                                    style={styles.transactionIcon}
                                                >
                                                    <Ionicons
                                                        name={isIncoming ? 'arrow-down' : 'arrow-up'}
                                                        size={20}
                                                        color={isIncoming ? BrandColors.success : BrandColors.error}
                                                    />
                                                </LinearGradient>
                                                <View>
                                                    <Text style={styles.transactionType}>{transaction.type}</Text>
                                                    <Text style={styles.transactionDescription}>
                                                        {transaction.description || 'Sin descripción'}
                                                    </Text>
                                                    <Text style={styles.transactionDate}>{formattedDate}</Text>
                                                </View>
                                            </View>
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
                                        </View>
                                    </Card>
                                </Animated.View>
                            );
                        })
                    )}
                </View>

                {/* Modals */}
                {user?.username && (
                    <QRCodeModal
                        visible={qrModalVisible}
                        onClose={() => setQrModalVisible(false)}
                        username={user.username}
                        userName={`${user.firstName} ${user.lastName}`}
                    />
                )}

                <RechargeModal
                    visible={rechargeModalVisible}
                    onClose={() => setRechargeModalVisible(false)}
                    onSuccess={handleRechargeSuccess}
                />

                <RechargeSuccessModal
                    visible={successModalVisible}
                    amount={lastRechargeAmount}
                    onClose={() => setSuccessModalVisible(false)}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    completenessSection: {
        marginBottom: 24,
    },
    completenessCard: {
        padding: 20,
        backgroundColor: BrandColors.white,
    },
    completenessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    completenessTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    completenessSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginTop: 2,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completeButtonText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    progressBar: {
        borderRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    statGradient: {
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 16,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: BrandColors.gray[600],
        fontWeight: '500',
    },
    favoriteLocationsList: {
        gap: 12,
        paddingRight: 20,
    },
    favoriteLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.white,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        width: 160,
    },
    favoriteLocationIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: BrandColors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    favoriteLocationName: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[800],
        flex: 1,
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
        color: BrandColors.gray[600],
        fontWeight: '500',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 4,
    },
    usernameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    usernameText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    verifiedBadge: {
        marginLeft: 2,
    },
    notificationButton: {
        padding: 8,
    },
    notificationBadge: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: BrandColors.error,
        borderWidth: 2,
        borderColor: BrandColors.gray[50],
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: BrandColors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: BrandColors.gray[500],
        fontSize: 14,
        marginTop: 20,
    },
    balanceCard: {
        padding: 28,
        marginBottom: 28,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -50,
        right: -30,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -20,
        left: -20,
    },
    balanceLabel: {
        fontSize: 15,
        color: BrandColors.white,
        opacity: 0.95,
        marginBottom: 8,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginBottom: 28,
        letterSpacing: -1,
    },
    noWalletContainer: {
        marginBottom: 28,
        alignItems: 'center',
    },
    noWalletText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginBottom: 4,
    },
    noWalletSubtext: {
        fontSize: 14,
        color: BrandColors.white,
        opacity: 0.8,
    },
    balanceActions: {
        flexDirection: 'row',
        gap: 20,
        zIndex: 1,
    },
    balanceActionButton: {
        flex: 1,
        alignItems: 'center',
    },
    actionIconContainer: {
        marginBottom: 10,
    },
    actionIconGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    actionText: {
        fontSize: 15,
        color: BrandColors.white,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        letterSpacing: -0.5,
    },
    seeAllText: {
        fontSize: 15,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCard: {
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    quickActionGradient: {
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 16,
    },
    quickActionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${BrandColors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickActionText: {
        fontSize: 14,
        color: BrandColors.gray[700],
        fontWeight: '600',
    },
    qrActionIcon: {
        backgroundColor: `${BrandColors.primary}20`,
    },
    transactionCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    transactionType: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    transactionDescription: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: -0.3,
    },
    transactionAmountPositive: {
        color: BrandColors.success,
    },
    transactionAmountNegative: {
        color: BrandColors.error,
    },
});
