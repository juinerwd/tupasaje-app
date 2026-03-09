import { Button, ErrorMessage, PinInput } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistration } from '@/hooks/useRegistration';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { pinSchema } from '@/utils/validation';

export default function Step4PinCreation() {
    const { setPin, nextStep } = useRegistration();

    const [pin, setPinLocal] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const handleContinue = () => {
        // Validate PIN using the shared schema
        const validation = pinSchema.safeParse(pin);

        if (!validation.success) {
            setError(validation.error.issues[0].message);
            return;
        }


        if (pin !== confirmPin) {
            setError('Los PINs no coinciden');
            return;
        }

        // Clear error and save PIN
        setError('');
        setPin(pin);
        nextStep();
    };


    const handlePinChange = (value: string) => {
        setPinLocal(value);
        if (error) setError('');
    };

    const handleConfirmPinChange = (value: string) => {
        setConfirmPin(value);
        if (error) setError('');
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
                    <Text style={styles.title}>Crea tu PIN</Text>
                    <Text style={styles.subtitle}>
                        Crea un PIN de 6 dígitos para proteger tu cuenta
                    </Text>

                    {/* Security Tips */}
                    <View style={styles.tipsContainer}>
                        <Text style={styles.tipsTitle}>Consejos de seguridad:</Text>
                        <View style={styles.tip}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                No uses números consecutivos (123456)
                            </Text>
                        </View>
                        <View style={styles.tip}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                Evita usar tu fecha de nacimiento
                            </Text>
                        </View>
                        <View style={styles.tip}>
                            <Text style={styles.tipBullet}>•</Text>
                            <Text style={styles.tipText}>
                                No compartas tu PIN con nadie
                            </Text>
                        </View>
                    </View>

                    {/* PIN Input */}
                    <PinInput
                        label="Ingresa tu PIN"
                        value={pin}
                        onChange={handlePinChange}
                        secureTextEntry
                    />

                    {/* Confirm PIN Input */}
                    <PinInput
                        label="Confirma tu PIN"
                        value={confirmPin}
                        onChange={handleConfirmPinChange}
                        secureTextEntry
                    />

                    {/* Error Message */}
                    {error && <ErrorMessage message={error} />}

                    {/* PIN Strength Indicator */}
                    {pin.length === 6 && (
                        <View style={styles.strengthContainer}>
                            <Text style={styles.strengthText}>
                                {!pinSchema.safeParse(pin).success
                                    ? '⚠️ PIN muy simple - Evita números repetidos o secuencias'
                                    : '✓ PIN seguro'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <Button
                        title="Continuar"
                        onPress={handleContinue}
                        disabled={pin.length !== 6 || confirmPin.length !== 6}
                        fullWidth
                        size="large"
                    />
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
        marginBottom: 24,
    },
    tipsContainer: {
        backgroundColor: BrandColors.gray[50],
        borderLeftWidth: 4,
        borderLeftColor: BrandColors.primary,
        borderRadius: 8,
        padding: 16,
        marginBottom: 32,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    tip: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    tipBullet: {
        fontSize: 14,
        color: BrandColors.primary,
        marginRight: 8,
        fontWeight: 'bold',
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
    },
    strengthContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: BrandColors.gray[50],
        borderRadius: 8,
    },
    strengthText: {
        fontSize: 14,
        color: BrandColors.gray[700],
        textAlign: 'center',
    },
    footer: {
        paddingTop: 16,
    },
});
