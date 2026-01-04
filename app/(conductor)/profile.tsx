import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ConductorProfile() {
    const { user } = useAuthStore();
    const { logout, isLoggingOut } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Mi Perfil</Text>

                <Card variant="elevated" style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="car" size={48} color={BrandColors.white} />
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Nombre completo</Text>
                        <Text style={styles.value}>{user?.firstName} {user?.lastName}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Teléfono</Text>
                        <Text style={styles.value}>{user?.phone}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Correo electrónico</Text>
                        <Text style={styles.value}>{user?.email}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.label}>Tipo de usuario</Text>
                        <Text style={styles.value}>Conductor</Text>
                    </View>
                </Card>

                <Button
                    title="Cerrar Sesión"
                    onPress={() => logout()}
                    loading={isLoggingOut}
                    variant="outline"
                    fullWidth
                    style={styles.logoutButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 24,
    },
    profileCard: {
        padding: 24,
        marginBottom: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        color: BrandColors.gray[600],
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    value: {
        fontSize: 16,
        color: BrandColors.gray[900],
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 16,
    },
});
