import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface SecurityVerificationModalProps {
    visible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    title?: string;
    subtitle?: string;
}

export function SecurityVerificationModal({
    visible,
    onSuccess,
    onCancel,
    title = 'Verificación de Seguridad',
    subtitle = 'Ingresa tu PIN de 6 dígitos para confirmar',
}: SecurityVerificationModalProps) {
    const { user } = useAuthStore();
    const { biometricsEnabled } = useSettingsStore();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pinInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setPin('');
            setError(null);
            if (biometricsEnabled) {
                handleBiometricAuth();
            } else {
                setTimeout(() => pinInputRef.current?.focus(), 500);
            }
        }
    }, [visible, biometricsEnabled]);

    const handleBiometricAuth = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirma tu identidad',
                    fallbackLabel: 'Usar PIN',
                    disableDeviceFallback: false,
                });

                if (result.success) {
                    onSuccess();
                } else if (result.error !== 'user_cancel') {
                    setError('Autenticación biométrica fallida');
                    pinInputRef.current?.focus();
                }
            } else {
                pinInputRef.current?.focus();
            }
        } catch (error) {
            console.error('Error en biometría:', error);
            pinInputRef.current?.focus();
        }
    };

    const handlePinChange = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, '');
        setPin(cleaned);
        setError(null);

        if (cleaned.length === 6) {
            verifyPin(cleaned);
        }
    };

    const verifyPin = async (inputPin: string) => {
        setIsVerifying(true);
        setError(null);

        try {
            // En una app real, esto debería ser una llamada al backend para validar el PIN
            // Por ahora, y dado que no queremos exponer el PIN hasheado en el cliente,
            // asumiremos que la validación se hace a través de un endpoint de seguridad.
            // Para propósitos de este MVP/Beta, simularemos el éxito si el PIN tiene 6 dígitos.
            // NOTA: Implementar validación real en producción.

            // Simulamos delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Si estuviéramos validando contra el backend, usaríamos algo como:
            // const isValid = await authService.verifyPin(inputPin);

            // Por ahora, para que el usuario pueda probar:
            onSuccess();
        } catch (err) {
            setError('PIN incorrecto. Inténtalo de nuevo.');
            setPin('');
        } finally {
            setIsVerifying(false);
        }
    };

    const renderPinDots = () => {
        return (
            <View style={styles.pinContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.pinDot,
                            pin.length > i && styles.pinDotFilled,
                            error && styles.pinDotError,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={FadeInUp.duration(400).springify()}
                    style={styles.container}
                >
                    <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                        <Ionicons name="close" size={24} color={BrandColors.gray[500]} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="shield-checkmark" size={32} color={BrandColors.primary} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>

                    <View style={styles.pinSection}>
                        {renderPinDots()}
                        {error && (
                            <Animated.Text entering={FadeInDown} style={styles.errorText}>
                                {error}
                            </Animated.Text>
                        )}

                        <TextInput
                            ref={pinInputRef}
                            value={pin}
                            onChangeText={handlePinChange}
                            keyboardType="number-pad"
                            maxLength={6}
                            style={styles.hiddenInput}
                            secureTextEntry
                            autoFocus={!biometricsEnabled}
                        />

                        {isVerifying && (
                            <ActivityIndicator
                                size="small"
                                color={BrandColors.primary}
                                style={styles.loader}
                            />
                        )}
                    </View>

                    {biometricsEnabled && (
                        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                            <Ionicons
                                name="finger-print"
                                size={32}
                                color={BrandColors.primary}
                            />
                            <Text style={styles.biometricText}>Usar biometría</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.footer}>
                        <Button
                            title="Cancelar"
                            variant="outline"
                            onPress={onCancel}
                            fullWidth
                        />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: BrandColors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${BrandColors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: BrandColors.gray[600],
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    pinSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 32,
    },
    pinContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: BrandColors.gray[300],
        backgroundColor: 'transparent',
    },
    pinDotFilled: {
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primary,
    },
    pinDotError: {
        borderColor: BrandColors.error,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: '100%',
        height: '100%',
    },
    errorText: {
        color: BrandColors.error,
        marginTop: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    loader: {
        marginTop: 16,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: `${BrandColors.primary}10`,
        marginBottom: 24,
    },
    biometricText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.primary,
    },
    footer: {
        width: '100%',
    },
});
