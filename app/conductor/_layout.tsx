import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConductorLayout() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    // Role-based access control
    if (user && user.role === UserRole.PASSENGER) {
        return <Redirect href="/passenger/dashboard" />;
    }

    return (
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
                name="notifications"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="edit-profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="security"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="help"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="change-pin"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="notification-settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="withdrawal-methods"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
