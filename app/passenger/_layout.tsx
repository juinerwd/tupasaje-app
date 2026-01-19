import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PassengerLayout() {
    const { user } = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Role-based access control
    if (user && user.role === UserRole.DRIVER) {
        return <Redirect href="/conductor/dashboard" />;
    }

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: BrandColors.primary,
                    tabBarInactiveTintColor: BrandColors.gray[500],
                    headerShown: false,
                    tabBarHideOnKeyboard: true,
                    tabBarStyle: {
                        borderTopWidth: 1,
                        borderTopColor: BrandColors.gray[200],
                        backgroundColor: BrandColors.white,
                        paddingBottom: Math.max(insets.bottom, 8),
                        paddingTop: 8,
                        height: 60 + Math.max(insets.bottom, 8),
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                        marginBottom: 4,
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
                <Tabs.Screen
                    name="transfer"
                    options={{
                        href: null // Ocultar de los tabs
                    }}
                />
            </Tabs>
        </View>
    );
}
