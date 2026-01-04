import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ErrorMessageProps {
    message: string;
    style?: ViewStyle;
    icon?: boolean;
}

export function ErrorMessage({ message, style, icon = true }: ErrorMessageProps) {
    if (!message) return null;

    return (
        <View style={[styles.container, style]}>
            {icon && (
                <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={BrandColors.error}
                    style={styles.icon}
                />
            )}
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee',
        borderLeftWidth: 4,
        borderLeftColor: BrandColors.error,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.error,
        lineHeight: 20,
    },
});
