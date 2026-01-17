import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { hasValidTokens } from '@/utils/secureStorage';

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { setLoading, setUser, setIsAuthenticated, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

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
        console.error('Error initializing auth:', error);
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
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
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
