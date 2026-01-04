import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as authService from '@/services/authService';
import { AuthSession } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    const router = useRouter();
    const [sessions, setSessions] = useState<AuthSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authService.getSessions();
            if (response.success && response.data) {
                setSessions(response.data.sessions);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSessions();
        setRefreshing(false);
    }, [fetchSessions]);

    const handleRevokeSession = (sessionId: string, deviceName: string) => {
        Alert.alert(
            'Cerrar sesión',
            `¿Estás seguro que deseas cerrar la sesión en ${deviceName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await authService.revokeSession(sessionId);
                            if (response.success) {
                                setSessions(prev => prev.filter(s => s.id !== sessionId));
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo cerrar la sesión.');
                        }
                    },
                },
            ]
        );
    };

    const handleRevokeAll = () => {
        Alert.alert(
            'Cerrar todas las sesiones',
            '¿Estás seguro que deseas cerrar sesión en todos los demás dispositivos?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar todas',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await authService.revokeAllSessions();
                            if (response.success) {
                                fetchSessions();
                                Alert.alert('Éxito', 'Se han cerrado todas las demás sesiones.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo completar la acción.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(passenger)/profile')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seguridad</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={BrandColors.primary}
                    />
                }
            >
                {/* PIN Section */}
                <Animated.View entering={FadeInDown.duration(600)}>
                    <Text style={styles.sectionTitle}>Acceso</Text>
                    <Card variant="outlined" style={styles.menuCard}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push('/(passenger)/change-pin' as any)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: BrandColors.primary + '15' }]}>
                                <Ionicons name="key-outline" size={22} color={BrandColors.primary} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuItemTitle}>Cambiar PIN</Text>
                                <Text style={styles.menuItemSubtitle}>Actualiza tu código de seguridad</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={BrandColors.gray[400]} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <View style={styles.menuItem}>
                            <View style={[styles.iconContainer, { backgroundColor: BrandColors.secondary + '15' }]}>
                                <Ionicons name="finger-print-outline" size={22} color={BrandColors.secondary} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuItemTitle}>Biometría</Text>
                                <Text style={styles.menuItemSubtitle}>Usa tu huella o rostro para entrar</Text>
                            </View>
                            <Text style={styles.statusBadge}>Próximamente</Text>
                        </View>
                    </Card>
                </Animated.View>

                {/* Sessions Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.sessionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sesiones Activas</Text>
                        {sessions.length > 1 && (
                            <TouchableOpacity onPress={handleRevokeAll}>
                                <Text style={styles.revokeAllText}>Cerrar todas</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading && !refreshing ? (
                        <ActivityIndicator size="small" color={BrandColors.primary} style={{ marginTop: 20 }} />
                    ) : sessions.length === 0 ? (
                        <Text style={styles.emptyText}>No se encontraron sesiones activas.</Text>
                    ) : (
                        sessions.map((session, index) => (
                            <Card key={session.id} variant="outlined" style={styles.sessionCard}>
                                <View style={styles.sessionContent}>
                                    <View style={styles.deviceIconContainer}>
                                        <Ionicons
                                            name={session.deviceType === 'mobile' ? 'phone-portrait-outline' : 'desktop-outline'}
                                            size={24}
                                            color={BrandColors.gray[600]}
                                        />
                                    </View>
                                    <View style={styles.sessionInfo}>
                                        <Text style={styles.deviceName}>
                                            {session.deviceName || 'Dispositivo desconocido'}
                                            {index === 0 && <Text style={styles.currentBadge}> (Actual)</Text>}
                                        </Text>
                                        <Text style={styles.sessionMeta}>
                                            {session.ipCity ? `${session.ipCity}, ` : ''}{session.ipCountry || 'Ubicación desconocida'}
                                        </Text>
                                        <Text style={styles.sessionTime}>
                                            Última actividad: {formatDate(session.lastActivityAt)}
                                        </Text>
                                    </View>
                                    {index !== 0 && (
                                        <TouchableOpacity
                                            onPress={() => handleRevokeSession(session.id, session.deviceName || 'este dispositivo')}
                                            style={styles.revokeButton}
                                        >
                                            <Ionicons name="log-out-outline" size={20} color={BrandColors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Card>
                        ))
                    )}
                </Animated.View>

                {/* Account Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.accountSection}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <Card variant="outlined" style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.iconContainer, { backgroundColor: BrandColors.error + '15' }]}>
                                <Ionicons name="trash-outline" size={22} color={BrandColors.error} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuItemTitle, { color: BrandColors.error }]}>Eliminar Cuenta</Text>
                                <Text style={styles.menuItemSubtitle}>Esta acción no se puede deshacer</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={BrandColors.gray[400]} />
                        </TouchableOpacity>
                    </Card>
                </Animated.View>
            </ScrollView>
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
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: BrandColors.gray[500],
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        padding: 0,
        backgroundColor: BrandColors.white,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
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
    },
    menuItemSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: BrandColors.gray[100],
        marginLeft: 72,
    },
    statusBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        color: BrandColors.gray[400],
        backgroundColor: BrandColors.gray[100],
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sessionsSection: {
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    revokeAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: BrandColors.error,
    },
    sessionCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
    },
    sessionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deviceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sessionInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    currentBadge: {
        color: BrandColors.primary,
        fontSize: 12,
    },
    sessionMeta: {
        fontSize: 13,
        color: BrandColors.gray[600],
        marginTop: 2,
    },
    sessionTime: {
        fontSize: 12,
        color: BrandColors.gray[400],
        marginTop: 4,
    },
    revokeButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: BrandColors.gray[400],
        marginTop: 20,
    },
    accountSection: {
        marginTop: 32,
    },
});
