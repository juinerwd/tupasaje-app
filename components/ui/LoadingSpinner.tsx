import { BrandColors } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
    fullScreen?: boolean;
    style?: ViewStyle;
}

export function LoadingSpinner({
    size = 'large',
    color = BrandColors.primary,
    fullScreen = false,
    style,
}: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <ActivityIndicator size={size} color={color} />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullScreenContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BrandColors.white,
    },
});
