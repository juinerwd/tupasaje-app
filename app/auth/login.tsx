import { Button, ErrorMessage, Input, PinInput } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { LoginFormData, loginSchema } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoggingIn, loginError } = useAuth();
    const [pin, setPin] = useState('');

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            phoneNumber: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(
                { phoneNumber: data.phoneNumber, pin },
                {
                    onSuccess: (result) => {
                        // Navigate based on user role
                        const user = result.user;
                        if (user.role === UserRole.PASSENGER) {
                            router.replace('/(passenger)/dashboard');
                        } else if (user.role === UserRole.DRIVER) {
                            router.replace('/(conductor)/dashboard');
                        } else {
                            router.replace('/(tabs)');
                        }
                    },
                    onError: (error) => {
                        console.error('❌ Login onError callback:', error);
                    },
                }
            );
        } catch (error) {
            console.error('❌ Login error caught:', error);
        }
    };

    const handleRegister = () => {
        router.push('/auth/register');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>TP</Text>
                    </View>
                    <Text style={styles.title}>Bienvenido</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Phone Input */}
                    <Controller
                        control={control}
                        name="phoneNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                label="Número de teléfono"
                                placeholder="3001234567"
                                keyboardType="phone-pad"
                                maxLength={10}
                                leftIcon="call-outline"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                error={errors.phoneNumber?.message}
                            />
                        )}
                    />

                    {/* PIN Input */}
                    <PinInput
                        label="PIN de seguridad"
                        value={pin}
                        onChange={setPin}
                        secureTextEntry
                    />

                    {/* Error Message */}
                    {loginError && (
                        <ErrorMessage
                            message={
                                loginError instanceof Error
                                    ? loginError.message
                                    : 'Error al iniciar sesión'
                            }
                        />
                    )}

                    {/* Login Button */}
                    <Button
                        title="Iniciar Sesión"
                        onPress={handleSubmit((data) => onSubmit({ ...data }))}
                        loading={isLoggingIn}
                        disabled={isLoggingIn || pin.length !== 6}
                        fullWidth
                        size="large"
                        style={styles.loginButton}
                    />

                    {/* Forgot PIN */}
                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>¿Olvidaste tu PIN?</Text>
                    </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
                    <TouchableOpacity onPress={handleRegister}>
                        <Text style={styles.registerText}>Regístrate aquí</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    form: {
        marginBottom: 32,
    },
    loginButton: {
        marginTop: 8,
    },
    forgotButton: {
        alignSelf: 'center',
        marginTop: 16,
        padding: 8,
    },
    forgotText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 14,
        color: BrandColors.gray[600],
        marginRight: 4,
    },
    registerText: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
});
