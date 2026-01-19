import { BrandColors } from '@/constants/theme';
import { hasValidTokens } from '@/utils/secureStorage';
import { isFirstTimeLaunch } from '@/utils/storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

export default function SplashScreen() {
    const router = useRouter();

    // Animation values
    const scale = useSharedValue(0.3);
    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { rotate: `${rotation.value}deg` },
            ],
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        // Start animations
        scale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
        });

        opacity.value = withTiming(1, {
            duration: 800,
            easing: Easing.out(Easing.exp),
        });

        rotation.value = withSequence(
            withTiming(360, {
                duration: 1000,
                easing: Easing.out(Easing.cubic),
            })
        );

        // Navigate after animation
        const timer = setTimeout(async () => {
            try {
                const isFirstTime = await isFirstTimeLaunch();
                const hasTokens = await hasValidTokens();

                if (hasTokens) {
                    // User is logged in, go to appropriate dashboard
                    // We'll determine the role in the main layout
                    router.replace('/(tabs)');
                } else if (isFirstTime) {
                    // First time user, show onboarding
                    router.replace('/onboarding');
                } else {
                    // Returning user, show login
                    router.replace('/auth/login');
                }
            } catch (error) {
                router.replace('/auth/login');
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                {/* Logo placeholder - replace with actual logo */}
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>TP</Text>
                </View>
                <Text style={styles.appName}>Tu Pasaje</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.tagline}>Tu forma segura de viajar</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: BrandColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    tagline: {
        fontSize: 16,
        color: BrandColors.white,
        opacity: 0.9,
    },
});
