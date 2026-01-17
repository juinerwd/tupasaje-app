import { QRCodeModal } from '@/components/QRCodeModal';
import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { formatDateOfBirthLong } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ConductorProfile() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { logout, isLoggingOut } = useAuth();
    const [showQRModal, setShowQRModal] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: () => logout({ reason: 'manual' }), style: 'destructive' },
            ]
        );
    };

    const menuItems = [
        {
            id: 'edit-profile',
            title: 'Editar Perfil',
            subtitle: 'Información personal y avatar',
            icon: 'person-outline',
            color: BrandColors.primary,
            action: () => router.push('/conductor/edit-profile' as any),
        },
        ...(user?.username ? [{
            id: 'qr-code',
            title: 'Mi Código QR',
            subtitle: 'Comparte tu código QR para recibir pagos',
            icon: 'qr-code-outline',
            color: BrandColors.secondary,
            action: () => setShowQRModal(true),
        }] : []),
        {
            id: 'security',
            title: 'Seguridad',
            subtitle: 'PIN y dispositivos vinculados',
            icon: 'shield-checkmark-outline',
            color: '#4CAF50',
            action: () => router.push('/conductor/security' as any),
        },
        {
            id: 'withdrawal-methods',
            title: 'Métodos de Retiro',
            subtitle: 'Cuentas bancarias y billeteras',
            icon: 'wallet-outline',
            color: BrandColors.secondary,
            action: () => router.push('/conductor/withdrawal-methods' as any),
        },
        {
            id: 'help',
            title: 'Ayuda y Soporte',
            subtitle: 'Preguntas frecuentes y contacto',
            icon: 'help-buoy-outline',
            color: '#FF9800',
            action: () => router.push('/conductor/help' as any),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <Animated.View entering={FadeInDown.duration(600)}>
                    <LinearGradient
                        colors={[BrandColors.primary, '#2E7D32']}
                        style={styles.profileHeader}
                    >
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Ionicons name="car" size={48} color={BrandColors.white} />
                            </View>
                            {user?.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={24} color={BrandColors.secondary} />
                                </View>
                            )}
                        </View>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userRole}>Conductor Certificado</Text>
                        {user?.username && (
                            <Text style={styles.userUsername}>@{user.username}</Text>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    <Card variant="elevated" style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="mail-outline" size={20} color={BrandColors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Correo Electrónico</Text>
                                <Text style={styles.infoValue}>{user?.email}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <Ionicons name="call-outline" size={20} color={BrandColors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Teléfono</Text>
                                <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
                            </View>
                        </View>

                        {user?.dateOfBirth && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Ionicons name="calendar-outline" size={20} color={BrandColors.primary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                                        <Text style={styles.infoValue}>{formatDateOfBirthLong(user.dateOfBirth)}</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {user?.bio && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <View style={styles.infoIconContainer}>
                                        <Ionicons name="information-circle-outline" size={20} color={BrandColors.primary} />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Biografía</Text>
                                        <Text style={styles.infoValue}>{user.bio}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </Card>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <Card variant="elevated" style={styles.menuCard}>
                        {menuItems.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={item.action}
                                >
                                    <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                                        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={BrandColors.gray[300]} />
                                </TouchableOpacity>
                                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
                            </React.Fragment>
                        ))}
                    </Card>
                </View>

                {/* Logout Button */}
                <Animated.View entering={FadeInUp.delay(400).duration(600)}
                    style={styles.logoutContainer}
                >
                    <Button
                        title="Cerrar Sesión"
                        onPress={handleLogout}
                        loading={isLoggingOut}
                        variant="outline"
                        fullWidth
                        style={styles.logoutButton}
                        icon={<Ionicons name="log-out-outline" size={20} color={BrandColors.error} />}
                    />
                    <Text style={styles.versionText}>Versión 1.0.0 (Beta)</Text>
                </Animated.View>
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
        paddingBottom: 40,
    },
    profileHeader: {
        padding: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: 4,
    },
    userUsername: {
        fontSize: 16,
        color: BrandColors.white,
        opacity: 0.9,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: BrandColors.gray[400],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    infoCard: {
        padding: 16,
        borderRadius: 20,
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
        backgroundColor: BrandColors.gray[100],
        marginVertical: 12,
    },
    menuCard: {
        padding: 8,
        borderRadius: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    menuDivider: {
        height: 1,
        backgroundColor: BrandColors.gray[50],
        marginLeft: 56,
    },
    logoutContainer: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    logoutButton: {
        borderColor: BrandColors.error + '30',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 12,
        color: BrandColors.gray[400],
    },
});
