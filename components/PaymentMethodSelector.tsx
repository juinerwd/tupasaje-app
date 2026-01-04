import { BrandColors } from '@/constants/theme';
import { PaymentMethodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PaymentMethod {
    type: PaymentMethodType;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        type: PaymentMethodType.CARD,
        name: 'Tarjeta',
        icon: 'card',
        description: 'Crédito o débito',
    },
    {
        type: PaymentMethodType.PSE,
        name: 'PSE',
        icon: 'business',
        description: 'Pago seguro en línea',
    },
    {
        type: PaymentMethodType.NEQUI,
        name: 'Nequi',
        icon: 'phone-portrait',
        description: 'Pago con Nequi',
    },
    {
        type: PaymentMethodType.BANCOLOMBIA,
        name: 'Bancolombia',
        icon: 'wallet',
        description: 'Botón Bancolombia',
    },
];

interface PaymentMethodSelectorProps {
    selected: PaymentMethodType | null;
    onSelect: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Método de Pago</Text>
            <View style={styles.methodsGrid}>
                {PAYMENT_METHODS.map((method) => {
                    const isSelected = selected === method.type;
                    return (
                        <TouchableOpacity
                            key={method.type}
                            style={[
                                styles.methodCard,
                                isSelected && styles.methodCardSelected,
                            ]}
                            onPress={() => onSelect(method.type)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                isSelected && styles.iconContainerSelected,
                            ]}>
                                <Ionicons
                                    name={method.icon}
                                    size={28}
                                    color={isSelected ? BrandColors.white : BrandColors.primary}
                                />
                            </View>
                            <Text style={[
                                styles.methodName,
                                isSelected && styles.methodNameSelected,
                            ]}>
                                {method.name}
                            </Text>
                            <Text style={[
                                styles.methodDescription,
                                isSelected && styles.methodDescriptionSelected,
                            ]}>
                                {method.description}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    methodsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    methodCard: {
        width: '48%',
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
    },
    methodCardSelected: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primaryLight,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: BrandColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSelected: {
        backgroundColor: BrandColors.primary,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    methodNameSelected: {
        color: BrandColors.primary,
    },
    methodDescription: {
        fontSize: 12,
        color: BrandColors.gray[600],
        textAlign: 'center',
    },
    methodDescriptionSelected: {
        color: BrandColors.gray[700],
    },
});
