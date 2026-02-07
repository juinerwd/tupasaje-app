import { registerDeviceToken } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            setupPushNotifications();
        }
    }, [isAuthenticated, user]);

    const setupPushNotifications = async () => {
        // Skip push notifications in Expo Go (SDK 53+ limitation)
        // Push notifications will work normally in development builds and production
        if (Constants.appOwnership === 'expo') {
            return;
        }

        try {
            // Dynamically import expo-notifications only when not in Expo Go
            const Notifications = await import('expo-notifications');

            // Configure notification handler
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });

            const token = await registerForPushNotificationsAsync(Notifications);
            if (token) {
                setExpoPushToken(token);

                // Register token in backend
                await registerDeviceToken({
                    token,
                    deviceName: Device.modelName || 'Unknown Device',
                    platform: Platform.OS,
                });
            }
        } catch (error) {
            console.error('Error setting up push notifications:', error);
        }
    };


    return {
        expoPushToken,
    };
}

async function registerForPushNotificationsAsync(Notifications: any) {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return;
        }

        try {
            // Get the project ID from Expo config
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;

            if (!projectId) {
                return;
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;

        } catch (e) {
            console.error('Error during getExpoPushTokenAsync:', e);
        }
    } else {
        // Must use physical device for Push Notifications
        return;
    }

    return token;
}

