import { QRCodeModal } from '@/components/QRCodeModal';
import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePassengerProfile, useUpdatePassengerProfile } from '@/hooks/usePassenger';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
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
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function PassengerProfile() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { logout, isLoggingOut } = useAuth();
    const [showQRModal, setShowQRModal] = useState(false);

    const { data: passengerProfile } = usePassengerProfile();
    const updateProfileMutation = useUpdatePassengerProfile();

    const toggleAutoRecharge = async (value: boolean) => {
        try {
            await updateProfileMutation.mutateAsync({ autoRecharge: value });
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la configuración de auto-recarga');
        }
    };

    // Animated values
    const avatarScale = useSharedValue(1);
    const verifiedBadgeRotate = useSharedValue(0);

    useEffect(() => {
        // Avatar breathing animation
        avatarScale.value = withRepeat(
            withSequence(
                withSpring(1.05, { damping: 3 }),
                withSpring(1, { damping: 3 })
            ),
            -1,
            false
        );

        // Verified badge rotation
        if (user?.isVerified) {
            verifiedBadgeRotate.value = withRepeat(
                withSequence(
                    withTiming(10, { duration: 1000 }),
                    withTiming(-10, { duration: 1000 }),
                    withTiming(0, { duration: 1000 })
                ),
                -1,
                false
            );
        }
    }, [user?.isVerified]);

    const avatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: avatarScale.value }],
    }));

    const verifiedBadgeStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${verifiedBadgeRotate.value}deg` }],
    }));

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: () => logout({}), style: 'destructive' },
            ]
        );
    };

    const menuItems = [
        {
            id: 'edit-profile',
            icon: 'create-outline',
            title: 'Editar perfil',
            subtitle: 'Actualiza tu información personal',
            onPress: () => router.push('/passenger/edit-profile' as any),
        },
        ...(user?.username ? [{
            id: 'qr-code',
            icon: 'qr-code-outline',
            title: 'Mi Código QR',
            subtitle: 'Comparte tu código QR',
            onPress: () => setShowQRModal(true),
        }] : []),
        {
            id: 'security',
            icon: 'shield-checkmark-outline',
            title: 'Seguridad',
            subtitle: 'Cambia tu PIN y configuración',
            onPress: () => router.push('/passenger/security' as any),
        },
        {
            id: 'notifications',
            icon: 'notifications-outline',
            title: 'Notificaciones',
            subtitle: 'Gestiona tus preferencias',
            onPress: () => router.push('/passenger/notification-settings' as any),
        },
        {
            id: 'payment-methods',
            icon: 'card-outline',
            title: 'Métodos de pago',
            subtitle: 'Administra tus tarjetas',
            onPress: () => router.push('/passenger/payment-methods' as any),
        },
        {
            id: 'help',
            icon: 'help-circle-outline',
            title: 'Ayuda y soporte',
            subtitle: 'Obtén ayuda cuando la necesites',
            onPress: () => router.push('/passenger/help' as any),
        },
    ];

    const getInitials = () => {
        if (!user?.firstName || !user?.lastName) return 'U';
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    };

    const getCompletionPercentage = () => {
        return user?.profileCompleteness || 0;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Gradient */}
                <AnimatedLinearGradient
                    colors={[BrandColors.primary, BrandColors.primaryDark, '#014d1e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    entering={FadeInDown.duration(600).springify()}
                    style={styles.header}
                >
                    {/* Avatar */}
                    <Animated.View style={[styles.avatarContainer, avatarStyle]}>
                        <LinearGradient
                            colors={['#ffffff', '#f0f0f0']}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </LinearGradient>
                        {user?.isVerified && (
                            <Animated.View style={[styles.verifiedBadge, verifiedBadgeStyle]}>
                                <Ionicons name="checkmark-circle" size={32} color={BrandColors.success} />
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* User Info */}
                    <Animated.Text
                        entering={FadeInUp.delay(200).duration(500)}
                        style={styles.userName}
                    >
                        {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                    </Animated.Text>
                    <Animated.Text
                        entering={FadeInUp.delay(300).duration(500)}
                        style={styles.userEmail}
                    >
                        {user?.email}
                    </Animated.Text>

                    {/* Decorative circles */}
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                </AnimatedLinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <Animated.View
                        entering={FadeInLeft.delay(400).duration(600).springify()}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#f8f9fa']}
                            style={styles.statGradient}
                        >
                            <Ionicons name="calendar-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.statValue}>{user?.loginCount || 0}</Text>
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
                            <Ionicons name="trophy-outline" size={24} color={BrandColors.secondary} />
                            <Text style={styles.statValue}>{getCompletionPercentage()}%</Text>
                            <Text style={styles.statLabel}>Perfil</Text>
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
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Puntos</Text>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Personal Information */}
                <Animated.View
                    entering={FadeInUp.delay(700).duration(500)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    <Card variant="elevated" style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="call-outline" size={20} color={BrandColors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Teléfono</Text>
                                <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
                            </View>
                            {user?.phoneVerified && (
                                <Ionicons name="checkmark-circle" size={20} color={BrandColors.success} />
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="card-outline" size={20} color={BrandColors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Documento</Text>
                                <Text style={styles.infoValue}>
                                    {user?.typeDni} {user?.numberDni}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="person-outline" size={20} color={BrandColors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Rol</Text>
                                <Text style={styles.infoValue}>
                                    {user?.role === 'PASSENGER' ? 'Pasajero' : user?.role}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </Animated.View>

                {/* Preferences Section */}
                <Animated.View
                    entering={FadeInUp.delay(750).duration(500)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Preferencias</Text>
                    <Card variant="elevated" style={styles.preferenceCard}>
                        <View style={styles.preferenceRow}>
                            <View style={styles.preferenceInfo}>
                                <View style={styles.infoIconContainer}>
                                    <Ionicons
                                        name={passengerProfile?.autoRecharge ? "sync-circle" : "sync-outline"}
                                        size={22}
                                        color={BrandColors.primary}
                                    />
                                </View>
                                <View style={styles.preferenceTextContainer}>
                                    <Text style={styles.preferenceTitle}>Auto-recarga</Text>
                                    <Text style={styles.preferenceSubtitle}>Recarga automática cuando el saldo es bajo</Text>
                                </View>
                            </View>
                            <Switch
                                value={passengerProfile?.autoRecharge || false}
                                onValueChange={toggleAutoRecharge}
                                trackColor={{ false: BrandColors.gray[200], true: BrandColors.primary }}
                                thumbColor={BrandColors.white}
                            />
                        </View>
                    </Card>
                </Animated.View>

                {/* Menu Options */}
                <Animated.View
                    entering={FadeInUp.delay(800).duration(500)}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    {menuItems.map((item, index) => (
                        <AnimatedTouchable
                            key={item.id}
                            entering={FadeInRight.delay(900 + index * 100).duration(600).springify()}
                            onPress={item.onPress}
                            style={styles.menuItem}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={24} color={BrandColors.primary} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={BrandColors.gray[400]} />
                        </AnimatedTouchable>
                    ))}
                </Animated.View>

                {/* Logout Button */}
                <Animated.View
                    entering={FadeInUp.delay(1400).duration(500)}
                    style={styles.logoutContainer}
                >
                    <Button
                        title="Cerrar Sesión"
                        onPress={handleLogout}
                        loading={isLoggingOut}
                        variant="outline"
                        fullWidth
                    />
                </Animated.View>

                {/* App Version */}
                <Animated.Text
                    entering={FadeInUp.delay(1500).duration(500)}
                    style={styles.versionText}
                >
                    Versión 1.0.0
                </Animated.Text>
            </ScrollView>

            {/* QR Code Modal */}
            {user?.username && (
                <QRCodeModal
                    visible={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    username={user.username}
                    userName={user.fullName || `${user.firstName} ${user.lastName}`}
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
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 20,
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: -30,
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -80,
        right: -60,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -40,
        left: -40,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
        zIndex: 1,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: BrandColors.white,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 2,
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginBottom: 4,
        zIndex: 1,
    },
    userEmail: {
        fontSize: 15,
        color: BrandColors.white,
        opacity: 0.9,
        zIndex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
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
        fontSize: 24,
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
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    infoCard: {
        padding: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${BrandColors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: BrandColors.gray[600],
        marginBottom: 2,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: BrandColors.gray[900],
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: BrandColors.gray[200],
        marginVertical: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${BrandColors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[600],
    },
    logoutContainer: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        color: BrandColors.gray[500],
        marginTop: 24,
    },
    preferenceCard: {
        padding: 16,
    },
    preferenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    preferenceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    preferenceTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    preferenceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    preferenceSubtitle: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
});
