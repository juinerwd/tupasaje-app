import { BrandColors } from '@/constants/theme';
import React, { useRef, useState } from 'react';
import {
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    View,
} from 'react-native';

interface PinInputProps {
    length?: number;
    value: string;
    onChange: (pin: string) => void;
    onComplete?: (pin: string) => void;
    error?: string;
    label?: string;
    secureTextEntry?: boolean;
    autoFocus?: boolean;
}

export function PinInput({
    length = 6,
    value,
    onChange,
    onComplete,
    error,
    label,
    secureTextEntry = true,
    autoFocus = false,
}: PinInputProps) {
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    React.useEffect(() => {
        if (autoFocus) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus]);

    const handleChange = (text: string, index: number) => {
        // Only allow numbers
        if (text && !/^\d+$/.test(text)) {
            return;
        }

        const newPin = value.split('');
        newPin[index] = text;
        const updatedPin = newPin.join('').slice(0, length);

        onChange(updatedPin);

        // Auto-focus next input
        if (text && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Trigger onComplete if full length reached
        if (updatedPin.length === length && onComplete) {
            onComplete(updatedPin);
        }
    };

    const handleKeyPress = (
        e: NativeSyntheticEvent<TextInputKeyPressEventData>,
        index: number
    ) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If current input is empty, focus previous input
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newPin = value.split('');
                newPin[index] = '';
                onChange(newPin.join(''));
            }
        }
    };

    const handleFocus = (index: number) => {
        setFocusedIndex(index);
    };

    const handleBlur = () => {
        setFocusedIndex(null);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.inputsContainer}>
                {Array.from({ length }).map((_, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                        }}
                        style={[
                            styles.input,
                            focusedIndex === index && styles.inputFocused,
                            error && styles.inputError,
                        ]}
                        value={value[index] || ''}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => handleFocus(index)}
                        onBlur={handleBlur}
                        keyboardType="number-pad"
                        maxLength={1}
                        secureTextEntry={secureTextEntry}
                        selectTextOnFocus
                    />
                ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
        marginBottom: 12,
        textAlign: 'center',
    },
    inputsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    input: {
        width: 48,
        height: 56,
        borderWidth: 1,
        borderColor: BrandColors.gray[300],
        borderRadius: 12,
        backgroundColor: BrandColors.white,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: BrandColors.gray[900],
    },
    inputFocused: {
        borderColor: BrandColors.primary,
        borderWidth: 2,
    },
    inputError: {
        borderColor: BrandColors.error,
    },
    errorText: {
        fontSize: 12,
        color: BrandColors.error,
        marginTop: 8,
        textAlign: 'center',
    },
});
