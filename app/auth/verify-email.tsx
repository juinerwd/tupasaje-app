import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/authService';
import { getErrorMessage } from '@/utils/errorHandling';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
    const { user, refetchProfile, logout, updateProfile } = useAuth();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const goToDashboard = (userData: any) => {
        const role = userData?.role?.toLowerCase() === 'driver' ? 'conductor' : 'passenger';
        router.replace(`/${role}/dashboard`);
    };

    useEffect(() => {
        if (user?.emailVerified) {
            goToDashboard(user);
        }
    }, [user?.emailVerified]);

    const handleVerify = async () => {
        if (code.length !== 6) {
            Alert.alert('Error', 'El código debe tener 6 dígitos');
            return;
        }

        if (!user) return;

        try {
            setIsLoading(true);
            const response = await authService.verifyCode(user.id, code, 'email');

            if (response.success) {
                // 1. Mostrar mensaje de éxito inmediatamente
                Alert.alert(
                    '¡Verificación Exitosa!',
                    'Tu correo ha sido verificado. Ahora puedes usar todas las funciones de Tu Pasaje.'
                );

                // 2. Actualizar el estado local instantáneamente sin esperar al servidor
                updateProfile({ emailVerified: true });

                // 3. Forzar refetch en segundo plano para sincronizar todo el perfil
                await refetchProfile();

                // 4. Navegar manualmente por si el useEffect demora
                goToDashboard(user);
            } else {
                Alert.alert('Error', response.error || 'Código incorrecto');
            }
        } catch (error) {
            const message = getErrorMessage(error, 'Error al verificar el código');
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!user || timer > 0) return;

        try {
            setResendLoading(true);
            await authService.sendVerificationCode(user.id, 'email');
            Alert.alert('Código Enviado', 'Hemos enviado un nuevo código de seguridad a tu correo electrónico.');
            setTimer(60);
        } catch (error) {
            const message = getErrorMessage(error, 'Error al reenviar el código');
            Alert.alert('Error', message);
        } finally {
            setResendLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout({ reason: 'manual' });
        router.replace('/auth/login');
    };

    const renderOTPBoxes = () => {
        const boxes = [];
        for (let i = 0; i < 6; i++) {
            const char = code[i] || '';
            const isFocused = code.length === i;
            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.otpBox,
                        char ? styles.otpBoxFilled : {},
                        isFocused ? styles.otpBoxFocused : {}
                    ]}
                >
                    <Text style={[styles.otpText, char ? styles.otpTextFilled : {}]}>
                        {char}
                    </Text>
                    {isFocused && <View style={styles.cursor} />}
                </View>
            );
        }
        return boxes;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topSection}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#018a2c" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
                        <View style={styles.iconCircle}>
                            <LinearGradient
                                colors={['#fcde02', '#d4ba02']}
                                style={styles.iconGradient}
                            >
                                <MaterialCommunityIcons name="email-check" size={42} color="#000" />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>Verifica tu correo</Text>
                        <Text style={styles.subtitle}>Hemos enviado un código de seguridad</Text>

                        <View style={styles.instructionBox}>
                            <Text style={styles.instructionText}>
                                Ingresa los 6 dígitos enviados a:
                            </Text>
                            <Text style={styles.emailHighlighted}>{user?.email}</Text>
                        </View>

                        <View style={styles.otpWrapper}>
                            <View style={styles.otpContainer}>
                                {renderOTPBoxes()}
                            </View>
                            <TextInput
                                ref={inputRef}
                                style={styles.hiddenInput}
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus={true}
                                contextMenuHidden={true}
                                caretHidden={true}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.verifyButton, (isLoading || code.length !== 6) && styles.buttonDisabled]}
                            onPress={handleVerify}
                            disabled={isLoading || code.length !== 6}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#018a2c" />
                            ) : (
                                <Text style={[styles.verifyButtonText, code.length !== 6 && { color: '#999' }]}>
                                    Confirmar y Activar
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.resendWrapper}>
                            <Text style={styles.noCodeText}>¿No recibiste el código?</Text>
                            <TouchableOpacity
                                onPress={handleResend}
                                disabled={timer > 0 || resendLoading}
                            >
                                <Text style={[
                                    styles.resendLink,
                                    (timer > 0 || resendLoading) && styles.resendDisabled
                                ]}>
                                    {timer > 0 ? `Reenviar en ${timer}s` : 'Solicitar nuevo código'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <View style={styles.bottomSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#888" />
                            <Text style={styles.logoutText}>Usar otra cuenta</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerNote}>
                            Al verificar tu correo, proteges tu cuenta y habilitas todas las funciones de Tu Pasaje.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
        justifyContent: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    content: {
        paddingHorizontal: 30,
        alignItems: 'center',
        paddingTop: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        padding: 6,
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fcde02',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    instructionBox: {
        marginTop: 24,
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
        width: '100%',
    },
    instructionText: {
        fontSize: 14,
        color: '#777',
    },
    emailHighlighted: {
        fontSize: 15,
        fontWeight: '800',
        color: '#018a2c',
        marginTop: 2,
    },
    otpWrapper: {
        width: '100%',
        height: 80,
        marginVertical: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    otpBox: {
        width: 44,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#F1F3F5',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    otpBoxFilled: {
        borderColor: '#018a2c30',
    },
    otpBoxFocused: {
        borderColor: '#018a2c',
        shadowColor: '#018a2c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    otpText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#E9ECEF',
    },
    otpTextFilled: {
        color: '#1A1A1A',
    },
    cursor: {
        position: 'absolute',
        width: 2,
        height: 24,
        backgroundColor: '#018a2c',
    },
    hiddenInput: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0,
    },
    verifyButton: {
        backgroundColor: '#fcde02',
        width: '100%',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fcde02',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    buttonDisabled: {
        backgroundColor: '#F1F3F5',
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    resendWrapper: {
        marginTop: 32,
        alignItems: 'center',
    },
    noCodeText: {
        fontSize: 14,
        color: '#999',
    },
    resendLink: {
        fontSize: 15,
        fontWeight: '800',
        color: '#018a2c',
        marginTop: 6,
        padding: 5,
    },
    resendDisabled: {
        color: '#ADB5BD',
    },
    bottomSection: {
        marginTop: 40,
        paddingHorizontal: 30,
        alignItems: 'center',
        paddingTop: 20,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    logoutText: {
        fontSize: 15,
        color: '#888',
        fontWeight: '700',
        marginLeft: 8,
    },
    footerNote: {
        textAlign: 'center',
        color: '#CED4DA',
        fontSize: 12,
        marginTop: 16,
        paddingHorizontal: 20,
        lineHeight: 18,
    }
});


