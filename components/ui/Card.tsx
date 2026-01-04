import { BrandColors } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
    return (
        <View style={[styles.card, styles[variant], style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        backgroundColor: BrandColors.white,
    },
    default: {
        backgroundColor: BrandColors.white,
    },
    elevated: {
        backgroundColor: BrandColors.white,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    outlined: {
        backgroundColor: BrandColors.white,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
});
