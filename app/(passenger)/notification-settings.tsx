import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const router = useRouter();
    const { data: preferences, isLoading, error, refetch } = useNotificationPreferences();
    const updatePreferencesMutation = useUpdateNotificationPreferences();

    const handleToggle = (key: string, value: boolean) => {
        updatePreferencesMutation.mutate({ [key]: value });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Cargando preferencias...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={BrandColors.error} />
                    <Text style={styles.errorTitle}>No se pudieron cargar las preferencias</Text>
                    <Button
                        title="Reintentar"
                        onPress={() => refetch()}
                        style={styles.retryButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const sections = [
        {
            title: 'Canales de Notificación',
            items: [
                { key: 'emailEnabled', label: 'Correo Electrónico', icon: 'mail-outline', color: '#4CAF50' },
                { key: 'smsEnabled', label: 'Mensajes de Texto (SMS)', icon: 'chatbubble-outline', color: '#2196F3' },
                { key: 'pushEnabled', label: 'Notificaciones Push', icon: 'notifications-outline', color: '#FF9800' },
                { key: 'inAppEnabled', label: 'Notificaciones en la App', icon: 'apps-outline', color: '#9C27B0' },
            ],
        },
        {
            title: 'Tipos de Notificaciones',
            items: [
                { key: 'authNotifications', label: 'Seguridad y Acceso', icon: 'shield-checkmark-outline', color: '#F44336' },
                { key: 'paymentNotifications', label: 'Pagos y Transferencias', icon: 'card-outline', color: '#3F51B5' },
                { key: 'rechargeNotifications', label: 'Recargas de Billetera', icon: 'wallet-outline', color: '#009688' },
                { key: 'supportNotifications', label: 'Soporte al Cliente', icon: 'help-buoy-outline', color: '#795548' },
                { key: 'systemNotifications', label: 'Actualizaciones del Sistema', icon: 'settings-outline', color: '#607D8B' },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    <Text style={styles.introText}>
                        Elige cómo y cuándo quieres recibir noticias nuestras.
                    </Text>
                </Animated.View>

                {sections.map((section, sectionIndex) => (
                    <Animated.View
                        key={section.title}
                        entering={FadeInDown.delay(200 * (sectionIndex + 1)).duration(600)}
                        style={styles.section}
                    >
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Card variant="outlined" style={styles.settingsCard}>
                            {section.items.map((item, index) => (
                                <View key={item.key}>
                                    <View style={styles.settingItem}>
                                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                                        </View>
                                        <View style={styles.settingTextContainer}>
                                            <Text style={styles.settingLabel}>{item.label}</Text>
                                        </View>
                                        <Switch
                                            value={preferences ? (preferences as any)[item.key] : false}
                                            onValueChange={(value) => handleToggle(item.key, value)}
                                            trackColor={{ false: BrandColors.gray[200], true: BrandColors.primary + '80' }}
                                            thumbColor={preferences && (preferences as any)[item.key] ? BrandColors.primary : BrandColors.white}
                                            ios_backgroundColor={BrandColors.gray[200]}
                                        />
                                    </View>
                                    {index < section.items.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </Card>
                    </Animated.View>
                ))}

                <View style={styles.footer}>
                    <Ionicons name="information-circle-outline" size={20} color={BrandColors.gray[400]} />
                    <Text style={styles.footerText}>
                        Las notificaciones críticas de seguridad no se pueden desactivar.
                    </Text>
                </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        minWidth: 150,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introText: {
        fontSize: 15,
        color: BrandColors.gray[600],
        marginBottom: 24,
        lineHeight: 22,
    },
    section: {
        marginBottom: 32,
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
    settingsCard: {
        padding: 0,
        backgroundColor: BrandColors.white,
        overflow: 'hidden',
    },
    settingItem: {
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
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    divider: {
        height: 1,
        backgroundColor: BrandColors.gray[100],
        marginLeft: 72,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    footerText: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginLeft: 8,
        textAlign: 'center',
    },
});
