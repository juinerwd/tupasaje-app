import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function ConductorLayout() {
    return (
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
        </Tabs>
    );
}
