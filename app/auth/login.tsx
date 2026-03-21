import { Button, ErrorMessage, Input, NumericKeypad, PinDisplay } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { LoginFormData, loginSchema } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoggingIn, loginError, resetLogin } = useAuth();

    const [step, setStep] = useState<1 | 2>(1);
    const [pin, setPin] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsKeyboardVisible(true);
            }
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsKeyboardVisible(false);
            }
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const {
        control,
        handleSubmit,
        trigger,
        getValues,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            phoneNumber: '',
        },
    });

    const handleNextStep = async () => {
        const isValid = await trigger('phoneNumber');
        if (isValid) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setStep(2);
            resetLogin();
            setPin('');
        }
    };

    const handleBack = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep(1);
        setPin('');
        resetLogin();
    };

    const handlePinPress = (key: string) => {
        // Clear login error when user starts typing again
        if (loginError) {
            resetLogin();
            // If they had an error and start typing a new PIN, clear the old one
            if (pin.length === 6 && key !== 'backspace') {
                setPin(key);
                return;
            }
        }

        if (key === 'backspace') {
            setPin((prev) => prev.slice(0, -1));
        } else {
            setPin((prev) => {
                if (prev.length < 6) {
                    const newPin = prev + key;
                    if (newPin.length === 6) {
                        // Submit synchronously when reaching 6 digits
                        setTimeout(() => executeLogin(newPin), 50);
                    }
                    return newPin;
                }
                return prev;
            });
        }
    };

    const executeLogin = (currentPin: string) => {
        const { phoneNumber } = getValues();
        resetLogin();
        login(
            { phoneNumber, pin: currentPin },
            {
                onSuccess: (result) => {
                    const user = result.user;
                    if (user.role === UserRole.PASSENGER) {
                        router.replace('/passenger/dashboard');
                    } else if (user.role === UserRole.DRIVER) {
                        router.replace('/conductor/dashboard');
                    } else {
                        router.replace('/passenger/dashboard');
                    }
                },
                onError: () => {
                    setPin(''); // Auto-clear PIN upon error
                }
            }
        );
    };

    const handleRegister = () => {
        router.push('/auth/register');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={step === 1} // Disable scrolling in step 2 for better keypad experience
            >
                {step === 1 ? (
                    <View style={styles.step1Container}>
                        <View style={[
                            styles.step1CenterWrap, 
                            isKeyboardVisible && { justifyContent: 'flex-start', paddingTop: Platform.OS === 'ios' ? 40 : 20 }
                        ]}>
                            <View style={styles.header}>
                                <View style={styles.logoCircle}>
                                    <Text style={styles.logoText}>TP</Text>
                                </View>
                                <Text style={styles.title}>Tu Pasaje</Text>
                                <Text style={styles.subtitle}>Tu viaje comienza aquí</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <Controller
                                    control={control}
                                    name="phoneNumber"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label="Ingresa tu número"
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
                                            error={errors.phoneNumber?.message}
                                        />
                                    )}
                                />

                                <Button
                                    title="Siguiente"
                                    onPress={handleNextStep}
                                    fullWidth
                                    size="large"
                                    style={styles.nextButton}
                                />
                            </View>
                        </View>

                        {!isKeyboardVisible && (
                            <View style={styles.footerWrap}>
                                <View style={styles.footer}>
                                    <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
                                    <TouchableOpacity onPress={handleRegister}>
                                        <Text style={styles.registerText}>Regístrate aquí</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        
                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                Al continuar, aceptas nuestros{' '}
                                <Text style={styles.termsLink}>Términos y Condiciones</Text> y la{' '}
                                <Text style={styles.termsLink}>Política de Privacidad</Text>.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.step2Container}>
                        <View style={styles.step2Header}>
                            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                                <Ionicons name="chevron-back" size={28} color={BrandColors.gray[800]} />
                            </TouchableOpacity>
                            <View style={styles.logoSmallCircle}>
                                <Text style={styles.logoSmallText}>TP</Text>
                            </View>
                            <View style={{ width: 44 }} />
                        </View>

                        <Text style={styles.pinTitle}>Ingresa tu clave</Text>

                        <PinDisplay length={6} value={pin} isError={!!loginError} />

                        {loginError && (
                            <View style={styles.errorContainer}>
                                <ErrorMessage
                                    message={
                                        loginError instanceof Error
                                            ? loginError.message
                                            : 'Error al iniciar sesión'
                                    }
                                />
                            </View>
                        )}

                        {isLoggingIn && (
                            <Text style={styles.loadingText}>Verificando...</Text>
                        )}

                        <View style={styles.keypadContainer}>
                            <NumericKeypad onPress={handlePinPress} />
                        </View>

                        <TouchableOpacity
                            style={styles.forgotBtn}
                            onPress={() => router.push('/auth/forgot-pin')}
                        >
                            <Text style={styles.forgotTxt}>¿Olvidaste tu clave?</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        paddingBottom: Platform.OS === 'android' ? 100 : 40,
    },
    /* General styles */
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
    formContainer: {
        marginBottom: 10,
    },
    nextButton: {
        marginTop: 16,
    },
    step1Container: {
        flex: 1,
    },
    step1CenterWrap: {
        flex: 1,
        justifyContent: 'center',
    },
    footerWrap: {
        justifyContent: 'flex-end',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
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
    termsContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    termsText: {
        fontSize: 12,
        color: BrandColors.gray[500],
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: BrandColors.primary,
        textDecorationLine: 'underline',
    },

    /* Step 2 specific styles */
    step2Container: {
        flex: 1,
        alignItems: 'center',
    },
    step2Header: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoSmallCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoSmallText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    pinTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    errorContainer: {
        marginBottom: 16,
        width: '100%',
    },
    loadingText: {
        color: BrandColors.primary,
        fontWeight: '600',
        marginBottom: 16,
    },
    keypadContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    forgotBtn: {
        padding: 12,
        marginBottom: 16,
    },
    forgotTxt: {
        fontSize: 14,
        color: BrandColors.primary,
        fontWeight: '600',
    },
});
