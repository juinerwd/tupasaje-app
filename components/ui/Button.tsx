import { BrandColors } from '@/constants/theme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    style,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const buttonStyles = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
    ].filter(Boolean);

    const textStyles = [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        isDisabled && styles.disabledText,
    ].filter(Boolean);

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? BrandColors.white : BrandColors.primary}
                    size="small"
                />
            ) : (
                <>
                    {icon && icon}
                    <Text style={textStyles}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        gap: 8,
    },

    // Variants
    primary: {
        backgroundColor: BrandColors.primary,
    },
    secondary: {
        backgroundColor: BrandColors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: BrandColors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },

    // Sizes
    small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },

    // States
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },

    // Text styles
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryText: {
        color: BrandColors.white,
        fontSize: 16,
    },
    secondaryText: {
        color: BrandColors.black,
        fontSize: 16,
    },
    outlineText: {
        color: BrandColors.primary,
        fontSize: 16,
    },
    ghostText: {
        color: BrandColors.primary,
        fontSize: 16,
    },
    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },
    disabledText: {
        opacity: 0.7,
    },
});
