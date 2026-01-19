import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AutoLogoutMessage } from '@/components/AutoLogoutMessage';
import { configToMilliseconds, getAutoLogoutConfig } from '@/config/autoLogoutConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { hasValidTokens } from '@/utils/secureStorage';
import { View } from 'react-native';

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { setLoading, setUser, setIsAuthenticated, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [showAutoLogoutMessage, setShowAutoLogoutMessage] = React.useState(false);

  // AUTO LOGOUT SETTINGS
  const autoLogoutConfig = getAutoLogoutConfig();
  const { timeout, enabled } = configToMilliseconds(autoLogoutConfig);

  const { handleUserActivity } = useInactivityLogout({
    timeout,
    enabled,
    onAutoLogout: () => {
      // Solo mostrar si no estamos ya en el login
      const inAuthGroup = segments[0] === 'passenger' || segments[0] === 'conductor';
      if (inAuthGroup) {
        setShowAutoLogoutMessage(true);
      }
    },
  });

  const handleLogoutConfirm = async () => {
    setShowAutoLogoutMessage(false);
    await logout('inactivity');
    router.replace('/auth/login');
  };

  // Check for existing tokens on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const hasTokens = await hasValidTokens();

        if (!hasTokens) {
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
        // If has tokens, the useProfile hook in the dashboard will fetch user data
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Redirect to login when user logs out
  useEffect(() => {
    const inAuthGroup = segments[0] === 'passenger' || segments[0] === 'conductor';

    if (!isAuthenticated && inAuthGroup) {
      // User logged out, redirect to login
      router.replace('/auth/login');
    }
  }, [isAuthenticated, segments]);

  return (
    <SafeAreaProvider>
      <View
        style={{ flex: 1 }}
        onTouchStart={handleUserActivity}
      >
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="passenger"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="conductor"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="shared/recharge-receipt"
              options={{
                headerShown: false,
                title: 'Recibo de Recarga',
              }}
            />
            <Stack.Screen
              name="shared/payment-receipt"
              options={{
                headerShown: false,
                title: 'Recibo de Pago',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </View>
      <AutoLogoutMessage
        visible={showAutoLogoutMessage}
        onClose={handleLogoutConfirm}
      />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
    </QueryClientProvider>
  );
}
