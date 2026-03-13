import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export function VerificationBanner() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user || user.emailVerified) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={styles.container}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="mail-unread" size={24} color="#018a2c" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Verifica tu correo</Text>
                <Text style={styles.subtitle}>
                    Valida tu cuenta para habilitar todas las funciones.
                </Text>
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/auth/verify-email')}
            >
                <Text style={styles.buttonText}>Verificar</Text>
                <Ionicons name="chevron-forward" size={16} color="#000" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#018a2c15',
        shadowColor: '#018a2c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#018a2c10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    button: {
        backgroundColor: '#fcde02',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        marginRight: 4,
    },
});
