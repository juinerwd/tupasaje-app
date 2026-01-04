import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useMarkAllNotificationsAsRead, useMarkNotificationAsRead, useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

export default function NotificationsInboxScreen() {
    const router = useRouter();
    const { data, isLoading, refetch, isFetching } = useNotifications({ limit: 50 });
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const handleNotificationPress = (notification: Notification) => {
        if (notification.status !== 'READ') {
            markAsReadMutation.mutate(notification.id);
        }
        // Handle navigation based on notification data if needed
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.PAYMENT:
            case NotificationType.RECHARGE:
                return 'wallet-outline';
            case NotificationType.AUTH:
            case NotificationType.SECURITY:
                return 'shield-checkmark-outline';
            case NotificationType.SYSTEM:
                return 'information-circle-outline';
            case NotificationType.SUPPORT:
                return 'help-circle-outline';
            case NotificationType.EMERGENCY:
                return 'alert-circle-outline';
            default:
                return 'notifications-outline';
        }
    };

    const getIconColor = (type: NotificationType) => {
        switch (type) {
            case NotificationType.EMERGENCY:
                return BrandColors.error;
            case NotificationType.PAYMENT:
            case NotificationType.RECHARGE:
                return BrandColors.primary;
            case NotificationType.AUTH:
            case NotificationType.SECURITY:
                return BrandColors.secondary;
            default:
                return BrandColors.gray[500];
        }
    };

    const renderItem = ({ item, index }: { item: Notification; index: number }) => {
        const isRead = item.status === 'READ';
        const date = new Date(item.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });

        return (
            <Animated.View entering={FadeInRight.delay(index * 50).duration(400)}>
                <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                >
                    <Card
                        variant="outlined"
                        style={[
                            styles.notificationCard,
                            !isRead && styles.unreadCard
                        ]}
                    >
                        <View style={styles.notificationContent}>
                            <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '15' }]}>
                                <Ionicons name={getIcon(item.type)} size={24} color={getIconColor(item.type)} />
                            </View>
                            <View style={styles.textContainer}>
                                <View style={styles.notificationHeader}>
                                    <Text style={[styles.title, !isRead && styles.unreadText]}>{item.title}</Text>
                                    {!isRead && <View style={styles.unreadDot} />}
                                </View>
                                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                                <Text style={styles.date}>{date}</Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <TouchableOpacity
                    onPress={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                >
                    <Ionicons name="checkmark-done-outline" size={24} color={BrandColors.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={data?.notifications || []}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            tintColor={BrandColors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color={BrandColors.gray[200]} />
                            <Text style={styles.emptyText}>No tienes notificaciones por ahora.</Text>
                        </View>
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
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    notificationCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
    },
    unreadCard: {
        backgroundColor: BrandColors.primary + '05',
        borderColor: BrandColors.primary + '30',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: BrandColors.gray[700],
        flex: 1,
    },
    unreadText: {
        color: BrandColors.gray[900],
        fontWeight: 'bold',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: BrandColors.primary,
        marginLeft: 8,
    },
    message: {
        fontSize: 14,
        color: BrandColors.gray[600],
        lineHeight: 20,
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        color: BrandColors.gray[400],
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[400],
        textAlign: 'center',
    },
});
