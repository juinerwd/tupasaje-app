import { BrandColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PinDisplayProps {
    length?: number;
    value: string;
    isError?: boolean;
}

export function PinDisplay({ length = 6, value, isError = false }: PinDisplayProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length }).map((_, index) => {
                const isFilled = index < value.length;

                return (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            isFilled ? styles.dotFilled : styles.dotEmpty,
                            isError && styles.dotError,
                        ]}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginVertical: 32,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    dotEmpty: {
        borderWidth: 2,
        borderColor: BrandColors.gray[400],
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: BrandColors.primary,
        borderColor: BrandColors.primary,
        borderWidth: 2,
    },
    dotError: {
        borderColor: BrandColors.error,
        backgroundColor: BrandColors.error,
    },
});
