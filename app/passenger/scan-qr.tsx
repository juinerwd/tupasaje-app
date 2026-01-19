import { QRScanner } from '@/components/QRScanner';
import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// No validation pattern here, let the backend handle it

export default function ScanQRScreen() {
    const router = useRouter();
    const { amount, transportType } = useLocalSearchParams<{ amount: string; transportType: string }>();
    const [isScanning, setIsScanning] = useState(true);

    const handleQRScanned = (data: string) => {
        // Vibrate on successful scan
        Vibration.vibrate(100);

        // Navigate to payment confirmation with QR data, amount and type
        router.push({
            pathname: '/passenger/payment-confirmation' as any,
            params: {
                qrData: data,
                amount,
                transportType
            },
        });
    };

    const handleError = (error: Error) => {
        Alert.alert(
            'Código QR Inválido',
            'El código escaneado no es válido. Por favor, intenta escanear el código QR del conductor nuevamente.',
            [
                {
                    text: 'Reintentar',
                    onPress: () => setIsScanning(true),
                },
                {
                    text: 'Cancelar',
                    onPress: () => router.back(),
                    style: 'cancel',
                },
            ]
        );
        setIsScanning(false);
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancelar Escaneo',
            '¿Estás seguro que deseas cancelar el escaneo?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí, Cancelar', onPress: () => router.back(), style: 'destructive' },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Ionicons name="close" size={28} color={BrandColors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escanear QR</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* QR Scanner */}
            <QRScanner
                onScan={handleQRScanned}
                onError={handleError}
                active={isScanning}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.black,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    cancelButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.white,
    },
    headerSpacer: {
        width: 44,
    },
});
