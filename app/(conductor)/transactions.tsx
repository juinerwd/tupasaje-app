import { BrandColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConductorTransactions() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Historial de Transacciones</Text>
                <Text style={styles.subtitle}>Próximamente...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
});
