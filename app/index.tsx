import { LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { hasValidTokens } from '@/utils/secureStorage';
import { isFirstTimeLaunch } from '@/utils/storage';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export default function Index() {
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, user, isLoading, logoutReason, clearLogoutReason } = useAuthStore();
    const previousAuthState = useRef(isAuthenticated);

    // Handle logout and show message if needed
    useEffect(() => {
        // Detect when user gets logged out
        if (previousAuthState.current && !isAuthenticated && !isLoading) {
            // User was authenticated but now is not
            if (logoutReason === 'inactivity') {
                // Show alert for inactivity logout
                Alert.alert(
                    'Sesión cerrada',
                    'Tu sesión se cerró automáticamente por inactividad. Por favor, inicia sesión nuevamente.',
                    [
                        {
                            text: 'Entendido',
                            onPress: () => {
                                clearLogoutReason();
                                router.replace('/auth/login');
                            },
                        },
                    ],
                    { cancelable: false }
                );
            } else {
                // Manual logout or other reason, just redirect
                clearLogoutReason();
                router.replace('/auth/login');
            }
        }

        // Update previous state
        previousAuthState.current = isAuthenticated;
    }, [isAuthenticated, isLoading, logoutReason]);

    useEffect(() => {
        const navigateToInitialRoute = async () => {
            try {
                // Wait a bit for auth to initialize
                await new Promise(resolve => setTimeout(resolve, 100));

                const hasTokens = await hasValidTokens();
                const isFirstTime = await isFirstTimeLaunch();

                if (hasTokens && user) {
                    // User is authenticated, navigate to appropriate dashboard
                    if (user.role === UserRole.PASSENGER) {
                        router.replace('/passenger/dashboard');
                    } else if (user.role === UserRole.DRIVER) {
                        router.replace('/conductor/dashboard');
                    } else {
                        // Fallback to splash if role is unknown
                        router.replace('/splash');
                    }
                } else if (isFirstTime) {
                    // First time user, show splash which will lead to onboarding
                    router.replace('/splash');
                } else {
                    // Returning user without tokens, go to login
                    router.replace('/auth/login');
                }
            } catch (error) {
                console.error('Error navigating to initial route:', error);
                // On error, default to splash
                router.replace('/splash');
            }
        };

        // Only navigate if we're still on the index route
        if ((segments as string[]).length === 0) {
            if (!isLoading) {
                navigateToInitialRoute();
            }
        }
    }, [isLoading, isAuthenticated, user, segments]);

    // Show loading spinner while determining initial route
    return <LoadingSpinner fullScreen />;
}
