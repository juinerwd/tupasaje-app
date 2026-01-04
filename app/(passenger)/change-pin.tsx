import { PinInput } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as authService from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePinScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Current, 2: New, 3: Confirm
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCurrentPinComplete = (pin: string) => {
        setCurrentPin(pin);
        setStep(2);
    };

    const handleNewPinComplete = (pin: string) => {
        setNewPin(pin);
        setStep(3);
    };

    const handleConfirmPinComplete = async (pin: string) => {
        if (pin !== newPin) {
            Alert.alert('Error', 'Los PINs no coinciden. Inténtalo de nuevo.');
            setConfirmPin('');
            return;
        }

        try {
            setLoading(true);
            const response = await authService.changePin({
                currentPin,
                newPin,
                confirmNewPin: pin,
            });

            if (response.success) {
                Alert.alert('Éxito', 'Tu PIN ha sido actualizado correctamente.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'No se pudo cambiar el PIN.';
            Alert.alert('Error', message);
            // Reset to step 1 if current PIN was wrong, or step 2 if new PIN was invalid
            if (message.toLowerCase().includes('actual')) {
                setStep(1);
                setCurrentPin('');
            } else {
                setStep(2);
                setNewPin('');
                setConfirmPin('');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Ingresa tu PIN actual</Text>
                        <Text style={styles.stepSubtitle}>Para continuar, necesitamos verificar tu identidad.</Text>
                        <PinInput
                            length={6}
                            value={currentPin}
                            onChange={setCurrentPin}
                            onComplete={handleCurrentPinComplete}
                            autoFocus
                        />
                    </Animated.View>
                );
            case 2:
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Ingresa tu nuevo PIN</Text>
                        <Text style={styles.stepSubtitle}>Elige un código de 6 dígitos que sea fácil de recordar pero difícil de adivinar.</Text>
                        <PinInput
                            length={6}
                            value={newPin}
                            onChange={setNewPin}
                            onComplete={handleNewPinComplete}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(1)}>
                            <Text style={styles.backStepText}>Volver</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            case 3:
                return (
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Confirma tu nuevo PIN</Text>
                        <Text style={styles.stepSubtitle}>Ingresa nuevamente tu nuevo PIN para confirmar.</Text>
                        <PinInput
                            length={6}
                            value={confirmPin}
                            onChange={setConfirmPin}
                            onComplete={handleConfirmPinComplete}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(2)}>
                            <Text style={styles.backStepText}>Volver</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cambiar PIN</Text>
                    <View style={{ width: 32 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.progressContainer}>
                        {[1, 2, 3].map((s) => (
                            <View
                                key={s}
                                style={[
                                    styles.progressDot,
                                    s <= step && styles.progressDotActive,
                                    s === step && styles.progressDotCurrent,
                                ]}
                            />
                        ))}
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={BrandColors.primary} />
                            <Text style={styles.loadingText}>Actualizando PIN...</Text>
                        </View>
                    ) : (
                        renderStep()
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 40,
        marginTop: 20,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: BrandColors.gray[200],
    },
    progressDotActive: {
        backgroundColor: BrandColors.primary,
    },
    progressDotCurrent: {
        transform: [{ scale: 1.3 }],
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
        marginBottom: 12,
    },
    stepSubtitle: {
        fontSize: 16,
        color: BrandColors.gray[500],
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    backStepButton: {
        marginTop: 40,
        padding: 12,
    },
    backStepText: {
        fontSize: 16,
        color: BrandColors.gray[500],
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
});
