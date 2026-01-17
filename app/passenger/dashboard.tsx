import { QRCodeModal } from '@/components/QRCodeModal';
import { RechargeModal } from '@/components/RechargeModal';
import { RechargeSuccessModal } from '@/components/RechargeSuccessModal';
import { Card, ProgressBar, Skeleton } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { usePassengerProfile, useUpdatePassengerProfile } from '@/hooks/usePassenger';
import { useProfileCompleteness } from '@/hooks/useProfile';
import { useClaimPromotion, usePromotions } from '@/hooks/usePromotions';
import { useWalletTransactions } from '@/hooks/useRecharge';
import { useWalletBalance } from '@/hooks/useWallet';
import { useAuthStore } from '@/store/authStore';
import { TransactionType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function PassengerDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);

    // TanStack Query Hooks
    const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useWalletBalance();
    const { data: passengerProfile, isLoading: isLoadingPassenger, refetch: refetchPassenger } = usePassengerProfile();
    const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useWalletTransactions();
    const { data: notificationData, isLoading: isLoadingNotifications, refetch: refetchNotifications } = useUnreadNotificationsCount();
    const { data: completenessData, isLoading: isLoadingCompleteness, refetch: refetchCompleteness } = useProfileCompleteness();
    const { data: promotions, isLoading: isLoadingPromotions } = usePromotions();
    const updateProfileMutation = useUpdatePassengerProfile();
    const claimPromotionMutation = useClaimPromotion();

    const recentTransactions = useMemo(() => transactionsData?.slice(0, 3) || [], [transactionsData]);
    const unreadCount = notificationData?.unreadCount || 0;
    const loading = isLoadingBalance || isLoadingPassenger || isLoadingTransactions || isLoadingNotifications;

    const currentBalance = useMemo(() => parseFloat(balance?.balance || '0'), [balance]);
    const isLowBalance = useMemo(() => currentBalance < 5000 && !passengerProfile?.autoRecharge, [currentBalance, passengerProfile?.autoRecharge]);

    const weeklySpending = useMemo(() => {
        if (!transactionsData) return [];
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const spending = new Array(7).fill(0);
        const now = new Date();

        transactionsData.forEach(tx => {
            const txDate = new Date(tx.createdAt);
            const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7 && tx.type === TransactionType.PAYMENT) {
                const dayIndex = txDate.getDay();
                spending[dayIndex] += Math.abs(parseFloat(tx.amount));
            }
        });

        // Reorder to have today as the last day
        const todayIndex = now.getDay();
        const orderedSpending = [];
        for (let i = 0; i < 7; i++) {
            const index = (todayIndex - 6 + i + 7) % 7;
            orderedSpending.push({
                day: days[index],
                amount: spending[index],
            });
        }
        return orderedSpending;
    }, [transactionsData]);

    const maxSpending = useMemo(() => Math.max(...weeklySpending.map(s => s.amount), 1000), [weeklySpending]);

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
        await Promise.all([
            refetchBalance(),
            refetchPassenger(),
            refetchTransactions(),
            refetchNotifications(),
            refetchCompleteness(),
        ]);
    }, [refetchBalance, refetchPassenger, refetchTransactions, refetchNotifications, refetchCompleteness]);

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
            router.push('/passenger/qr-payment');
        } else if (action === 'pay-transport') {
            router.push('/passenger/pay-transport');
        } else if (action === 'transfer') {
            router.push('/passenger/transfer' as any);
        } else if (action === 'emergency') {
            router.push('/passenger/emergency-code' as any);
        }
    };

    const handleRechargeSuccess = () => {
        fetchDashboardData();
    };

    const handlePromotionPress = (promotion: any) => {
        if (promotion.actionType === 'RECHARGE') {
            setRechargeModalVisible(true);
        } else if (promotion.actionType === 'REFERRAL') {
            Alert.alert('Referir', 'Comparte tu código con un amigo para ganar pasajes gratis.');
        } else if (promotion.actionType === 'INTERNAL' && promotion.actionValue) {
            router.push(promotion.actionValue as any);
        } else {
            claimPromotionMutation.mutate(promotion.id);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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
                        onPress={() => router.push('/passenger/notifications')}
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
                    {isLoadingBalance ? (
                        <Skeleton width={200} height={42} borderRadius={8} style={{ marginBottom: 28, backgroundColor: 'rgba(255,255,255,0.2)' }} />
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

                {/* Low Balance Warning */}
                {isLowBalance && (
                    <Animated.View
                        entering={FadeInDown.duration(600)}
                        style={styles.warningBanner}
                    >
                        <Ionicons name="alert-circle" size={20} color={BrandColors.warning} />
                        <Text style={styles.warningBannerText}>
                            Saldo bajo. Activa la auto-recarga para no quedarte sin pasaje.
                        </Text>
                    </Animated.View>
                )}

                {/* Profile Completeness */}
                {isLoadingCompleteness ? (
                    <View style={styles.completenessSection}>
                        <Card variant="elevated" style={styles.completenessCard}>
                            <Skeleton width="100%" height={60} />
                        </Card>
                    </View>
                ) : completenessData && !completenessData.completed && (
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600).springify()}
                        style={styles.completenessSection}
                    >
                        <Card variant="elevated" style={styles.completenessCard}>
                            <View style={styles.completenessHeader}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.completenessTitle}>Completa tu perfil</Text>
                                    <Text style={styles.completenessSubtitle}>
                                        {completenessData.missing?.length > 0
                                            ? `Te falta: ${completenessData.missing.slice(0, 2).join(', ')}${completenessData.missing.length > 2 ? '...' : ''}`
                                            : `${completenessData.completeness}% completado`}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/passenger/edit-profile')}
                                    style={styles.completeButton}
                                >
                                    <Text style={styles.completeButtonText}>Completar</Text>
                                    <Ionicons name="arrow-forward" size={16} color={BrandColors.primary} />
                                </TouchableOpacity>
                            </View>
                            <ProgressBar
                                progress={completenessData.completeness / 100}
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
                            {isLoadingPassenger ? (
                                <Skeleton width={40} height={24} style={{ marginTop: 8, marginBottom: 4 }} />
                            ) : (
                                <Text style={styles.statValue}>{passengerProfile?.totalTrips || 0}</Text>
                            )}
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
                            {isLoadingPassenger ? (
                                <Skeleton width={60} height={24} style={{ marginTop: 8, marginBottom: 4 }} />
                            ) : (
                                <Text style={styles.statValue}>
                                    {formatCurrency(passengerProfile?.totalSpent || 0)}
                                </Text>
                            )}
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
                            {isLoadingPassenger ? (
                                <Skeleton width={40} height={24} style={{ marginTop: 8, marginBottom: 4 }} />
                            ) : (
                                <Text style={styles.statValue}>
                                    {passengerProfile?.averageRating?.toFixed(1) || '0.0'}
                                </Text>
                            )}
                            <Text style={styles.statLabel}>Rating</Text>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Activity Summary */}
                <Animated.View
                    entering={FadeInDown.delay(650).duration(600).springify()}
                    style={styles.section}
                >
                    <Card variant="elevated" style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                            <Text style={styles.activityTitle}>Resumen semanal</Text>
                            <View style={styles.savingsBadge}>
                                <Ionicons name="leaf" size={14} color={BrandColors.success} />
                                <Text style={styles.savingsText}>Ahorraste {formatCurrency(12500)}</Text>
                            </View>
                        </View>

                        <View style={styles.chartContainer}>
                            {weeklySpending.map((item, index) => (
                                <View key={index} style={styles.chartBarContainer}>
                                    <View style={styles.chartBarWrapper}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                { height: `${(item.amount / maxSpending) * 100}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.chartDay}>{item.day}</Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                </Animated.View>

                {/* Emergency Code Status */}
                {!isLoadingPassenger && (
                    <Animated.View
                        entering={FadeInDown.delay(700).duration(600).springify()}
                        style={styles.emergencySection}
                    >
                        <Card variant="elevated" style={[
                            styles.emergencyCard,
                            passengerProfile?.hasActiveEmergencyCode ? styles.emergencyActive : styles.emergencyInactive
                        ]}>
                            <View style={styles.emergencyContent}>
                                <View style={[
                                    styles.emergencyIconContainer,
                                    passengerProfile?.hasActiveEmergencyCode ? styles.emergencyIconActive : styles.emergencyIconInactive
                                ]}>
                                    <Ionicons
                                        name={passengerProfile?.hasActiveEmergencyCode ? "shield-checkmark" : "alert-circle"}
                                        size={24}
                                        color={passengerProfile?.hasActiveEmergencyCode ? BrandColors.success : BrandColors.warning}
                                    />
                                </View>
                                <View style={styles.emergencyTextContainer}>
                                    <Text style={styles.emergencyTitle}>
                                        {passengerProfile?.hasActiveEmergencyCode ? 'Código Activo' : 'Sin Código'}
                                    </Text>
                                    <Text style={styles.emergencySubtitle} numberOfLines={2}>
                                        {passengerProfile?.hasActiveEmergencyCode
                                            ? 'Listo para usar sin conexión'
                                            : 'Paga sin batería o internet'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/passenger/emergency-code')}
                                    style={[
                                        styles.emergencyButton,
                                        passengerProfile?.hasActiveEmergencyCode ? styles.emergencyButtonView : styles.emergencyButtonGenerate
                                    ]}
                                >
                                    <Ionicons
                                        name={passengerProfile?.hasActiveEmergencyCode ? "eye-outline" : "add"}
                                        size={18}
                                        color={passengerProfile?.hasActiveEmergencyCode ? BrandColors.primary : BrandColors.white}
                                    />
                                    <Text style={[
                                        styles.emergencyButtonText,
                                        passengerProfile?.hasActiveEmergencyCode ? styles.emergencyButtonTextView : styles.emergencyButtonTextGenerate
                                    ]}>
                                        {passengerProfile?.hasActiveEmergencyCode ? 'Ver' : 'Generar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    </Animated.View>
                )}

                {/* Promotions Banner */}
                {!isLoadingPromotions && promotions && promotions.length > 0 && (
                    <View style={styles.section}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            contentContainerStyle={styles.promotionsList}
                        >
                            {promotions.map((promo, index) => (
                                <AnimatedTouchable
                                    key={promo.id}
                                    entering={FadeInRight.delay(500 + index * 100).duration(600)}
                                    style={[styles.promotionCard, { backgroundColor: promo.backgroundColor }]}
                                    onPress={() => handlePromotionPress(promo)}
                                >
                                    <View style={styles.promotionContent}>
                                        <View style={styles.promotionTextContainer}>
                                            <Text style={styles.promotionTitle}>{promo.title}</Text>
                                            <Text style={styles.promotionSubtitle}>{promo.description}</Text>
                                            <View style={styles.promotionActionBadge}>
                                                <Text style={styles.promotionActionText}>{promo.actionLabel}</Text>
                                                <Ionicons name="chevron-forward" size={12} color={BrandColors.primary} />
                                            </View>
                                        </View>
                                        <Ionicons name={promo.icon as any} size={40} color={BrandColors.primary} />
                                    </View>
                                </AnimatedTouchable>
                            ))}
                        </ScrollView>
                    </View>
                )}

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
                            onPress={() => handleActionPress('pay-transport')}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9fa']}
                                style={styles.quickActionGradient}
                            >
                                <View style={styles.quickActionIconContainer}>
                                    <Ionicons name="bus-outline" size={32} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.quickActionText}>Pagar Pasaje</Text>
                            </LinearGradient>
                        </AnimatedTouchable>

                        <AnimatedTouchable
                            entering={FadeInUp.delay(750).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => handleActionPress('transfer')}
                        >
                            <LinearGradient
                                colors={['#ffffff', '#f8f9fa']}
                                style={styles.quickActionGradient}
                            >
                                <View style={styles.quickActionIconContainer}>
                                    <Ionicons name="swap-horizontal-outline" size={32} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.quickActionText}>Transferir</Text>
                            </LinearGradient>
                        </AnimatedTouchable>

                        <AnimatedTouchable
                            entering={FadeInUp.delay(800).duration(600).springify()}
                            style={styles.quickActionCard}
                            onPress={() => router.push('/passenger/scan-qr' as any)}
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
                            onPress={() => router.push('/passenger/transactions')}
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
                                onPress={() => router.push('/passenger/payment-methods')}
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
                            onPress={() => router.push('/passenger/favorite-locations' as any)}
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
                                <View>
                                    <Text style={[styles.quickActionText, { color: BrandColors.error }]}>Emergencia</Text>
                                    {passengerProfile?.emergencyCounter && passengerProfile.emergencyCounter > 0 ? (
                                        <Text style={styles.emergencyStatusText}>Código activo</Text>
                                    ) : null}
                                </View>
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
                            <TouchableOpacity onPress={() => router.push('/passenger/favorite-locations' as any)}>
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
                        <TouchableOpacity onPress={() => router.push('/passenger/transactions')}>
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
    scrollContent: {
        padding: 20,
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

    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.warning + '15',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: BrandColors.warning + '30',
        gap: 10,
    },
    warningBannerText: {
        flex: 1,
        fontSize: 13,
        color: BrandColors.gray[700],
        lineHeight: 18,
        fontWeight: '500',
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
    emergencySection: {
        marginBottom: 28,
    },
    emergencyCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    emergencyActive: {
        backgroundColor: BrandColors.white,
        borderColor: `${BrandColors.success}30`,
    },
    emergencyInactive: {
        backgroundColor: BrandColors.white,
        borderColor: `${BrandColors.warning}30`,
    },
    emergencyContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emergencyIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyIconActive: {
        backgroundColor: `${BrandColors.success}10`,
    },
    emergencyIconInactive: {
        backgroundColor: `${BrandColors.warning}10`,
    },
    emergencyTextContainer: {
        flex: 1,
    },
    emergencyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    emergencySubtitle: {
        fontSize: 12,
        color: BrandColors.gray[500],
        lineHeight: 16,
    },
    emergencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 6,
    },
    emergencyButtonGenerate: {
        backgroundColor: BrandColors.primary,
    },
    emergencyButtonView: {
        backgroundColor: BrandColors.white,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    emergencyButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emergencyButtonTextGenerate: {
        color: BrandColors.white,
    },
    emergencyButtonTextView: {
        color: BrandColors.primary,
    },
    activityCard: {
        padding: 20,
        backgroundColor: BrandColors.white,
        borderRadius: 20,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.success + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    savingsText: {
        fontSize: 12,
        color: BrandColors.success,
        fontWeight: '600',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
    },
    chartBarContainer: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarWrapper: {
        height: 80,
        width: 12,
        backgroundColor: BrandColors.gray[100],
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBar: {
        width: '100%',
        backgroundColor: BrandColors.primary,
        borderRadius: 6,
    },
    chartDay: {
        fontSize: 11,
        color: BrandColors.gray[500],
        marginTop: 8,
        fontWeight: '600',
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
    promotionsList: {
        paddingRight: 20,
        gap: 16,
    },
    promotionCard: {
        width: 300,
        borderRadius: 20,
        padding: 20,
        height: 120,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    promotionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    promotionTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    promotionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    promotionSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[600],
        fontWeight: '500',
    },
    promotionActionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
        gap: 4,
    },
    promotionActionText: {
        fontSize: 12,
        color: BrandColors.primary,
        fontWeight: '700',
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
    emergencyStatusText: {
        fontSize: 11,
        color: BrandColors.error,
        fontWeight: '500',
        marginTop: 2,
    },
    favoriteLocationsList: {
        paddingRight: 20,
        gap: 12,
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
    emptyText: {
        textAlign: 'center',
        color: BrandColors.gray[500],
        fontSize: 14,
        marginTop: 20,
    },
});
