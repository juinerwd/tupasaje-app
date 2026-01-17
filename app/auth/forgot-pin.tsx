import { Button, ErrorMessage, Input, PinInput } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPinScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New PIN
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRequestOtp = async () => {
        if (phoneNumber.length !== 10) {
            setError('Ingresa un número de teléfono válido');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Aquí iría la llamada al backend: POST /auth/forgot-pin
            // const response = await authService.forgotPin({ phoneNumber });
            // setToken(response.token);

            // Simulación para Beta
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep(2);
            Alert.alert('Código Enviado', 'Se ha enviado un código de verificación a tu teléfono (Simulado: 123456)');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al solicitar el código');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setError('Ingresa el código de 6 dígitos');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Aquí iría la llamada al backend: POST /auth/verify-otp
            // await authService.verifyOtp({ token, otp });

            // Simulación para Beta
            await new Promise(resolve => setTimeout(resolve, 1000));
            setStep(3);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Código inválido');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPin = async () => {
        if (newPin.length !== 6) {
            setError('El PIN debe tener 6 dígitos');
            return;
        }

        if (newPin !== confirmPin) {
            setError('Los PINs no coinciden');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Aquí iría la llamada al backend: POST /auth/reset-pin
            // await authService.resetPin({ token, otp, newPin });

            // Simulación para Beta
            await new Promise(resolve => setTimeout(resolve, 1500));
            Alert.alert('Éxito', 'Tu PIN ha sido actualizado correctamente', [
                { text: 'Ir al Login', onPress: () => router.replace('/auth/login') }
            ]);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al actualizar el PIN');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recuperar PIN</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {step === 1 && (
                        <View>
                            <Text style={styles.title}>¿Olvidaste tu PIN?</Text>
                            <Text style={styles.subtitle}>
                                Ingresa tu número de teléfono para recibir un código de verificación.
                            </Text>
                            <Input
                                label="Número de teléfono"
                                placeholder="3001234567"
                                keyboardType="phone-pad"
                                maxLength={10}
                                leftIcon="call-outline"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                error={error}
                            />
                            <Button
                                title="Enviar Código"
                                onPress={handleRequestOtp}
                                loading={isLoading}
                                fullWidth
                                style={styles.button}
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View>
                            <Text style={styles.title}>Verifica tu número</Text>
                            <Text style={styles.subtitle}>
                                Ingresa el código de 6 dígitos enviado al {phoneNumber}
                            </Text>
                            <PinInput
                                label="Código de verificación"
                                value={otp}
                                onChange={setOtp}
                                length={6}
                            />
                            {error && <ErrorMessage message={error} />}
                            <Button
                                title="Verificar Código"
                                onPress={handleVerifyOtp}
                                loading={isLoading}
                                fullWidth
                                style={styles.button}
                            />
                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={() => setStep(1)}
                            >
                                <Text style={styles.resendText}>¿No recibiste el código? Reintentar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 3 && (
                        <View>
                            <Text style={styles.title}>Nuevo PIN</Text>
                            <Text style={styles.subtitle}>
                                Crea un nuevo PIN de 6 dígitos para tu cuenta.
                            </Text>
                            <PinInput
                                label="Nuevo PIN"
                                value={newPin}
                                onChange={setNewPin}
                                secureTextEntry
                            />
                            <View style={styles.spacer} />
                            <PinInput
                                label="Confirmar Nuevo PIN"
                                value={confirmPin}
                                onChange={setConfirmPin}
                                secureTextEntry
                            />
                            {error && <ErrorMessage message={error} />}
                            <Button
                                title="Actualizar PIN"
                                onPress={handleResetPin}
                                loading={isLoading}
                                fullWidth
                                style={styles.button}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 24,
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
        lineHeight: 22,
    },
    button: {
        marginTop: 24,
    },
    resendButton: {
        alignSelf: 'center',
        marginTop: 24,
        padding: 8,
    },
    resendText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    spacer: {
        height: 16,
    },
});
