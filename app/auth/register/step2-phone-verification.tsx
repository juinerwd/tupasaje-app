import { Button, ErrorMessage, Input, PinDisplay } from '@/components/ui';
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
    TextInput,
    LayoutAnimation,
    Keyboard,
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
    const scrollViewRef = React.useRef<ScrollView>(null);

    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => {
            // Desplazar basado en si estamos pidiendo el numero o el codigo
            const offsetY = codeSent ? 160 : 50; 
            scrollViewRef.current?.scrollTo({ y: offsetY, animated: true });
        });

        const hideSub = Keyboard.addListener(hideEvent, () => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [codeSent]);

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

            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            // TEMPORAL: Simular envío de código mientras no hay backend
            setTimeout(() => {
                setCodeSent(true);
            }, 500);

        } catch (error) {
            console.error('Error sending code:', error);
        }
    };

    const handleCodeChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setLocalCode(numericValue);

        if (localVerifyError || verifyCodeError) {
            setLocalVerifyError(null);
        }

        if (numericValue.length === 6) {
            setTimeout(() => executeVerify(numericValue), 50);
        }
    };

    const executeVerify = async (code: string) => {
        setLocalVerifyError(null);
        try {
            setVerificationCode(code);

            // TEMPORAL: Verificar código de prueba
            const TEST_CODE = '123456';

            if (code === TEST_CODE) {
                setTimeout(() => {
                    nextStep();
                }, 300);
            } else {
                setLocalVerifyError('Código incorrecto. Usa: 123456');
                setLocalCode('');
            }
        } catch (error: any) {
            setLocalVerifyError(error.message || 'Error al verificar código');
            setLocalCode('');
        }
    };

    const handleResendCode = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLocalCode('');
        setCodeSent(false); // Go back to sending state
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                                        keyboardType="numeric"
                                        inputMode="numeric"
                                        maxLength={10}
                                        leftIcon="call-outline"
                                        value={value}
                                        onChangeText={(text) => {
                                            const numericValue = text.replace(/[^0-9]/g, '');
                                            onChange(numericValue);
                                        }}
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

                            <View style={styles.pinContainer}>
                                <TextInput
                                    value={localCode}
                                    onChangeText={handleCodeChange}
                                    keyboardType="numeric"
                                    inputMode="numeric"
                                    maxLength={6}
                                    autoFocus
                                    caretHidden
                                    style={styles.hiddenInput}
                                />
                                <PinDisplay value={localCode} length={6} isError={!!(verifyCodeError || localVerifyError)} />
                                {(verifyCodeError || localVerifyError) && (
                                    <ErrorMessage
                                        message={
                                            localVerifyError ||
                                            (verifyCodeError instanceof Error
                                                ? verifyCodeError.message
                                                : 'Código inválido')
                                        }
                                        style={{ marginTop: 16 }}
                                    />
                                )}
                            </View>

                            <Button
                                title="Cambiar número"
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
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 8,
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
    pinContainer: {
        marginBottom: 32,
        alignItems: 'center',
        position: 'relative',
    },
    hiddenInput: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0,
        zIndex: 10,
    },
});
