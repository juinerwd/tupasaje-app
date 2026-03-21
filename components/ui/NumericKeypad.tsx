import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NumericKeypadProps {
    onPress: (key: string) => void;
}

export function NumericKeypad({ onPress }: NumericKeypadProps) {
    const keys = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'backspace'],
    ];

    return (
        <View style={styles.container}>
            {keys.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map((key) => {
                        if (key === '') {
                            return <View key={`empty-${rowIndex}`} style={styles.keyEmpty} />;
                        }
                        return (
                            <TouchableOpacity
                                key={key}
                                style={styles.keyCell}
                                onPress={() => onPress(key)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.keyButton}>
                                    {key === 'backspace' ? (
                                        <Ionicons
                                            name="backspace-outline"
                                            size={28}
                                            color={BrandColors.gray[800]}
                                        />
                                    ) : (
                                        <Text style={styles.keyText}>{key}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 320,
    },
    keyEmpty: {
        flex: 1,
        height: 70,
        marginHorizontal: 8,
    },
    keyCell: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    keyButton: {
        width: 70,
        height: 70,
        borderRadius: 16,
        backgroundColor: BrandColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: BrandColors.gray[800],
    },
});
