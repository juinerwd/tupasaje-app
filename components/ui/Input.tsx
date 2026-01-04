import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: any;
}

export function Input({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    secureTextEntry,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const showPasswordToggle = secureTextEntry;
    const actuallySecure = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={error ? BrandColors.error : BrandColors.gray[400]}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[styles.input, style]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholderTextColor={BrandColors.gray[400]}
                    secureTextEntry={actuallySecure}
                    {...props}
                />

                {showPasswordToggle && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={BrandColors.gray[400]}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !showPasswordToggle && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIcon}
                        disabled={!onRightIconPress}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={error ? BrandColors.error : BrandColors.gray[400]}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
            {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
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
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BrandColors.gray[300],
        borderRadius: 12,
        backgroundColor: BrandColors.white,
        paddingHorizontal: 12,
    },
    inputContainerFocused: {
        borderColor: BrandColors.primary,
        borderWidth: 2,
    },
    inputContainerError: {
        borderColor: BrandColors.error,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: BrandColors.gray[900],
    },
    leftIcon: {
        marginRight: 8,
    },
    rightIcon: {
        marginLeft: 8,
        padding: 4,
    },
    errorText: {
        fontSize: 12,
        color: BrandColors.error,
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginTop: 4,
    },
});
