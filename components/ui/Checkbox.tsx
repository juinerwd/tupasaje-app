import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface CheckboxProps {
    label?: string | React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
    style?: ViewStyle;
}

export function Checkbox({ label, checked, onChange, error, style }: CheckboxProps) {
    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.touchable}
                onPress={() => onChange(!checked)}
                activeOpacity={0.7}
            >
                <View
                    style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                        error && styles.checkboxError,
                    ]}
                >
                    {checked && (
                        <Ionicons name="checkmark" size={16} color={BrandColors.white} />
                    )}
                </View>
                {label && (
                    <View style={styles.labelContainer}>
                        {typeof label === 'string' ? (
                            <Text style={styles.label}>{label}</Text>
                        ) : (
                            label
                        )}
                    </View>
                )}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: BrandColors.gray[300],
        backgroundColor: BrandColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primary,
    },
    checkboxError: {
        borderColor: BrandColors.error,
    },
    labelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
    },
    errorText: {
        fontSize: 12,
        color: BrandColors.error,
        marginTop: 4,
        marginLeft: 36,
    },
});
