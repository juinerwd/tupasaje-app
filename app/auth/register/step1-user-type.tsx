import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistrationStore } from '@/store/registrationStore';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Step1UserType() {
    const { userType, setUserType, nextStep } = useRegistrationStore();

    const handleContinue = () => {
        if (userType) {
            nextStep();
        }
    };

    const userTypes = [
        {
            role: UserRole.PASSENGER,
            title: 'Pasajero',
            description: 'Recarga saldo y paga tu transporte',
            icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            role: UserRole.DRIVER,
            title: 'Conductor',
            description: 'Recibe pagos de pasajeros',
            icon: 'car-outline' as keyof typeof Ionicons.glyphMap,
        },
    ];

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>Selecciona tu tipo de usuario</Text>
                <Text style={styles.subtitle}>
                    Elige cómo vas a usar Tu Pasaje
                </Text>

                {/* User Type Cards */}
                <View style={styles.cardsContainer}>
                    {userTypes.map((type) => (
                        <TouchableOpacity
                            key={type.role}
                            style={[
                                styles.card,
                                userType === type.role && styles.cardSelected,
                            ]}
                            onPress={() => setUserType(type.role)}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    userType === type.role && styles.iconContainerSelected,
                                ]}
                            >
                                <Ionicons
                                    name={type.icon}
                                    size={48}
                                    color={
                                        userType === type.role
                                            ? BrandColors.white
                                            : BrandColors.primary
                                    }
                                />
                            </View>
                            <Text
                                style={[
                                    styles.cardTitle,
                                    userType === type.role && styles.cardTitleSelected,
                                ]}
                            >
                                {type.title}
                            </Text>
                            <Text
                                style={[
                                    styles.cardDescription,
                                    userType === type.role && styles.cardDescriptionSelected,
                                ]}
                            >
                                {type.description}
                            </Text>

                            {/* Check icon */}
                            {userType === type.role && (
                                <View style={styles.checkContainer}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={24}
                                        color={BrandColors.primary}
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Continue Button */}
            <View style={styles.footer}>
                <Button
                    title="Continuar"
                    onPress={handleContinue}
                    disabled={!userType}
                    fullWidth
                    size="large"
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
        marginBottom: 32,
    },
    cardsContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
        alignItems: 'center',
    },
    cardSelected: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.gray[50],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainerSelected: {
        backgroundColor: BrandColors.primary,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    cardTitleSelected: {
        color: BrandColors.primary,
    },
    cardDescription: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    cardDescriptionSelected: {
        color: BrandColors.gray[700],
    },
    checkContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    footer: {
        paddingTop: 16,
    },
});
