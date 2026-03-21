import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistrationStore } from '@/store/registrationStore';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Step1UserType() {
    const { setUserType, nextStep } = useRegistrationStore();
    const router = useRouter();

    const userTypes = [
        {
            role: UserRole.PASSENGER,
            title: 'Soy Pasajero',
            description: 'Busca viajes, paga tu transporte público y muévete por la ciudad con total libertad y seguridad.',
            action: 'Empezar a viajar',
            icon: 'person',
            iconColor: BrandColors.primary,
            iconBg: '#E0E7FF',
        },
        {
            role: UserRole.DRIVER,
            title: 'Soy Conductor',
            description: 'Genera ingresos, gestiona tus rutas y conecta con pasajeros de forma eficiente y profesional.',
            action: 'Empezar a conducir',
            icon: 'car',
            iconColor: '#B45309',
            iconBg: '#FFEDD5',
        },
    ];

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>¿Cómo quieres usar Tu Pasaje?</Text>
                <Text style={styles.subtitle}>
                    Selecciona tu perfil para personalizar tu experiencia de viaje o gestión de servicios.
                </Text>

                {/* User Type Cards */}
                <View style={styles.cardsContainer}>
                    {userTypes.map((type) => (
                        <TouchableOpacity
                            key={type.role}
                            style={styles.card}
                            onPress={() => {
                                setUserType(type.role);
                                nextStep();
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: type.iconBg }]}>
                                <Ionicons
                                    name={type.icon as any}
                                    size={32}
                                    color={type.iconColor}
                                />
                            </View>
                            <Text style={styles.cardTitle}>{type.title}</Text>
                            <Text style={styles.cardDescription}>{type.description}</Text>
                            
                            <View style={styles.cardAction}>
                                <Text style={[styles.actionText, { color: type.iconColor }]}>{type.action}</Text>
                                <Ionicons name="arrow-forward" size={16} color={type.iconColor} style={styles.actionIcon} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Text */}
                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={24} color={BrandColors.primary} />
                    <Text style={styles.infoText}>
                        Tu elección determinará las funciones disponibles en tu panel principal.
                    </Text>
                </View>
            </View>

            {/* Login Link */}
            <View style={styles.footer}>
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
                    <TouchableOpacity onPress={() => router.push('/auth/login')}>
                        <Text style={styles.loginLink}>Inicia sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    cardsContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: BrandColors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: BrandColors.gray[600],
        lineHeight: 20,
        marginBottom: 16,
    },
    cardAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    actionIcon: {
        marginLeft: 4,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: BrandColors.gray[700],
        marginLeft: 12,
        lineHeight: 18,
    },
    footer: {
        paddingTop: 8,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
    },
    loginText: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginRight: 4,
    },
    loginLink: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: 'bold',
    },
});
