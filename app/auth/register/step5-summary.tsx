import { Button, Card, ErrorMessage, LoadingSpinner } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/hooks/useRegistration';
import { ID_TYPES, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Step5Summary() {
    const router = useRouter();
    const isSubmittingRef = React.useRef(false);

    const {
        userType,
        phone,
        personalData,
        pin,
        goToStep,
        getRegistrationData,
        register,
        isRegistering,
        registerError,
        resetRegistration,
    } = useRegistration();

    const { login } = useAuth();

    const handleConfirmRegistration = async () => {
        // Prevent double submission
        if (isSubmittingRef.current) {
            console.log('⚠️ Registration already in progress, ignoring duplicate call');
            return;
        }

        isSubmittingRef.current = true;

        try {
            const registrationData = getRegistrationData();

            await register(registrationData, {
                onSuccess: async (result) => {
                    try {
                        await login(
                            { phoneNumber: phone, pin },
                            {
                                onSuccess: (loginResult) => {
                                    resetRegistration();
                                    Alert.alert(
                                        '¡Registro exitoso!',
                                        'Tu cuenta ha sido creada correctamente',
                                        [
                                            {
                                                text: 'Continuar',
                                                onPress: () => {
                                                    if (userType === UserRole.PASSENGER) {
                                                        router.replace('/passenger/dashboard');
                                                    } else {
                                                        router.replace('/conductor/dashboard');
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                },
                                onError: (loginError) => {
                                    resetRegistration();
                                    Alert.alert(
                                        'Registro exitoso',
                                        'Por favor inicia sesión con tus credenciales',
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () => router.replace('/auth/login'),
                                            },
                                        ]
                                    );
                                },
                            }
                        );
                    } catch (loginError) {
                        resetRegistration();
                        Alert.alert(
                            'Registro exitoso',
                            'Por favor inicia sesión con tus credenciales',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => router.replace('/auth/login'),
                                },
                            ]
                        );
                    }
                },
                onError: (error) => {
                    Alert.alert(
                        'Error al registrar',
                        'Hubo un error al registrar tu cuenta, por favor intenta de nuevo'
                    );
                },
            });
        } catch (error) {
            Alert.alert(
                'Error al registrar',
                'Hubo un error al registrar tu cuenta, por favor intenta de nuevo'
            );
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const getIdTypeLabel = (value: string) => {
        return ID_TYPES.find((type) => type.value === value)?.label || value;
    };

    const summaryItems = [
        {
            label: 'Tipo de usuario',
            value: userType === UserRole.PASSENGER ? 'Pasajero' : 'Conductor',
            step: 1,
            icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            label: 'Teléfono',
            value: phone,
            step: 2,
            icon: 'call-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            label: 'Nombre completo',
            value: `${personalData?.firstName} ${personalData?.lastName}`,
            step: 3,
            icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            label: 'Identificación',
            value: `${getIdTypeLabel(personalData?.idType || '')} - ${personalData?.idNumber}`,
            step: 3,
            icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            label: 'Correo electrónico',
            value: personalData?.email || '',
            step: 3,
            icon: 'mail-outline' as keyof typeof Ionicons.glyphMap,
        },
        {
            label: 'PIN de seguridad',
            value: '••••••',
            step: 4,
            icon: 'lock-closed-outline' as keyof typeof Ionicons.glyphMap,
        },
    ];

    if (isRegistering) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>Revisa tu información</Text>
                <Text style={styles.subtitle}>
                    Verifica que todos los datos sean correctos antes de confirmar
                </Text>

                {/* Summary Cards */}
                <View style={styles.cardsContainer}>
                    {summaryItems.map((item, index) => (
                        <Card key={index} variant="outlined" style={styles.card}>
                            <View style={styles.cardContent}>
                                <View style={styles.cardLeft}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons
                                            name={item.icon}
                                            size={20}
                                            color={BrandColors.primary}
                                        />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardLabel}>{item.label}</Text>
                                        <Text style={styles.cardValue}>{item.value}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => goToStep(item.step)}
                                >
                                    <Ionicons
                                        name="create-outline"
                                        size={20}
                                        color={BrandColors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}
                </View>

                {/* Error Message */}
                {registerError && (
                    <ErrorMessage
                        message={
                            registerError instanceof Error
                                ? registerError.message
                                : 'Error al registrar usuario'
                        }
                    />
                )}

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                        Al confirmar, aceptas nuestros{' '}
                        <Text style={styles.termsLink}>Términos y Condiciones</Text> y{' '}
                        <Text style={styles.termsLink}>Política de Privacidad</Text>
                    </Text>
                </View>
            </View>

            {/* Confirm Button */}
            <View style={styles.footer}>
                <Button
                    title="Confirmar registro"
                    onPress={handleConfirmRegistration}
                    loading={isRegistering}
                    disabled={isRegistering}
                    fullWidth
                    size="large"
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
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
        marginBottom: 24,
        lineHeight: 24,
    },
    cardsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    card: {
        padding: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 12,
        color: BrandColors.gray[600],
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    editButton: {
        padding: 8,
    },
    termsContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: BrandColors.gray[50],
        borderRadius: 12,
    },
    termsText: {
        fontSize: 12,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: BrandColors.primary,
        fontWeight: '600',
    },
    footer: {
        paddingTop: 24,
    },
});
