import { AutoLogoutMessage } from '@/components/AutoLogoutMessage';
import { configToMilliseconds, getAutoLogoutConfig } from '@/config/autoLogoutConfig';
import { BrandColors } from '@/constants/theme';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

export default function PassengerLayout() {
    const [showAutoLogoutMessage, setShowAutoLogoutMessage] = useState(false);
    const { logout } = useAuthStore();
    const router = useRouter();

    // AUTO LOGOUT SETTINGS
    const autoLogoutConfig = getAutoLogoutConfig();
    const { timeout, enabled } = configToMilliseconds(autoLogoutConfig);

    useInactivityLogout({
        timeout,
        enabled,
        onAutoLogout: () => setShowAutoLogoutMessage(true),
    });

    const handleLogoutConfirm = async () => {
        setShowAutoLogoutMessage(false);
        await logout();
        router.replace('/auth/login');
    };

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: BrandColors.primary,
                    tabBarInactiveTintColor: BrandColors.gray[500],
                    headerShown: false,
                    tabBarStyle: {
                        borderTopWidth: 1,
                        borderTopColor: BrandColors.gray[200],
                        paddingBottom: 8,
                        paddingTop: 8,
                        height: 60,
                    },
                }}
            >
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Inicio',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="transactions"
                    options={{
                        title: 'Historial',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="list-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="recharge"
                    options={{
                        title: 'Recargar',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="add-circle-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="pay-transport"
                    options={{
                        title: 'Pagar',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="card-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="edit-profile"
                    options={{
                        href: null, // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="scan-qr"
                    options={{
                        href: null, // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="payment-confirmation"
                    options={{
                        href: null, // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="payment-receipt"
                    options={{
                        href: null, // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="qr-payment"
                    options={{
                        href: null, // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="wallet"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="notifications"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="emergency-code"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="favorite-locations"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="security"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="change-pin"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="payment-methods"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="notification-settings"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
                <Tabs.Screen
                    name="help"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
            </Tabs>
            <AutoLogoutMessage
                visible={showAutoLogoutMessage}
                onClose={handleLogoutConfirm}
            />
        </View>
    );
}
