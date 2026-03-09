import { Button, ErrorMessage, Input, PinInput } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistration } from '@/hooks/useRegistration';
import { PhoneVerificationFormData, phoneVerificationSchema } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function Step2PhoneVerification() {
    const {
        phone,
        setPhone,
        setVerificationCode,
        nextStep,
        isSendingCode,
        sendCodeError,
        isVerifyingCode,
        verifyCodeError,
    } = useRegistration();

    const [codeSent, setCodeSent] = useState(false);
    const [localCode, setLocalCode] = useState('');
    const [localVerifyError, setLocalVerifyError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<PhoneVerificationFormData>({
        resolver: zodResolver(phoneVerificationSchema),
        defaultValues: {
            phone: phone || '',
        },
    });

    const handleSendCode = async (data: PhoneVerificationFormData) => {
        try {
            setLocalVerifyError(null);
            setPhone(data.phone);

            // TEMPORAL: Simular envío de código mientras no hay backend
            setTimeout(() => {
                setCodeSent(true);
            }, 500);

        } catch (error) {
            console.error('Error sending code:', error);
        }
    };

    const handleVerifyCode = async () => {
        if (localCode.length !== 6) return;
        setLocalVerifyError(null);

        try {
            setVerificationCode(localCode);

            // TEMPORAL: Verificar código de prueba
            const TEST_CODE = '123456';

            if (localCode === TEST_CODE) {
                // Código correcto
                setTimeout(() => {
                    nextStep();
                }, 300);
            } else {
                // Código incorrecto - Seteamos el error local en lugar de lanzarlo
                setLocalVerifyError('Código incorrecto. Usa: 123456');
            }
        } catch (error: any) {
            console.error('Error verifying code:', error);
            setLocalVerifyError(error.message || 'Error al verificar código');
        }
    };

    const handleResendCode = () => {
        setLocalCode('');
        handleSendCode({ phone });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Title */}
                    <Text style={styles.title}>Verifica tu número</Text>
                    <Text style={styles.subtitle}>
                        {!codeSent
                            ? 'Ingresa tu número de teléfono para recibir un código de verificación'
                            : 'Ingresa el código de 6 dígitos que enviamos a tu teléfono'}
                    </Text>

                    {!codeSent ? (
                        /* Phone Input */
                        <>
                            <Controller
                                control={control}
                                name="phone"
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
                                        error={errors.phone?.message}
                                    />
                                )}
                            />

                            {sendCodeError && (
                                <ErrorMessage
                                    message={
                                        sendCodeError instanceof Error
                                            ? sendCodeError.message
                                            : 'Error al enviar código'
                                    }
                                />
                            )}

                            <Button
                                title="Enviar código"
                                onPress={handleSubmit(handleSendCode)}
                                loading={isSendingCode}
                                disabled={isSendingCode}
                                fullWidth
                                size="large"
                            />
                        </>
                    ) : (
                        /* Verification Code Input */
                        <>
                            <View style={styles.phoneDisplay}>
                                <Text style={styles.phoneText}>{phone}</Text>
                            </View>

                            {/* TEMPORAL: Mostrar código de prueba */}
                            <View style={styles.testCodeHint}>
                                <Text style={styles.testCodeLabel}>🧪 Modo de prueba</Text>
                                <Text style={styles.testCodeText}>
                                    Código de verificación: <Text style={styles.testCodeValue}>123456</Text>
                                </Text>
                            </View>

                            <PinInput
                                label="Código de verificación"
                                value={localCode}
                                onChange={setLocalCode}
                                secureTextEntry={false}
                            />

                            {(verifyCodeError || localVerifyError) && (
                                <ErrorMessage
                                    message={
                                        localVerifyError ||
                                        (verifyCodeError instanceof Error
                                            ? verifyCodeError.message
                                            : 'Código inválido')
                                    }
                                />
                            )}

                            <Button
                                title="Verificar código"
                                onPress={handleVerifyCode}
                                loading={isVerifyingCode}
                                disabled={isVerifyingCode || localCode.length !== 6}
                                fullWidth
                                size="large"
                            />

                            <Button
                                title="Reenviar código"
                                onPress={handleResendCode}
                                variant="ghost"
                                fullWidth
                                style={styles.resendButton}
                            />
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: Platform.OS === 'android' ? 100 : 40,
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
        lineHeight: 24,
    },
    phoneDisplay: {
        backgroundColor: BrandColors.gray[100],
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    phoneText: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    testCodeHint: {
        backgroundColor: BrandColors.secondary + '20',
        borderLeftWidth: 4,
        borderLeftColor: BrandColors.secondary,
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    testCodeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: BrandColors.gray[700],
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    testCodeText: {
        fontSize: 14,
        color: BrandColors.gray[700],
    },
    testCodeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        fontFamily: 'monospace',
    },
    resendButton: {
        marginTop: 16,
    },
});
