import { Button, Card, ErrorMessage } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRANSPORT_TYPES = [
    { id: 'bus', name: 'Bus', icon: 'bus-outline' as keyof typeof Ionicons.glyphMap, fare: 2500 },
    { id: 'metro', name: 'Metro', icon: 'train-outline' as keyof typeof Ionicons.glyphMap, fare: 2800 },
    { id: 'taxi', name: 'Taxi', icon: 'car-outline' as keyof typeof Ionicons.glyphMap, fare: 5000 },
];

export default function PayTransportScreen() {
    const router = useRouter();
    const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedTransportData = TRANSPORT_TYPES.find((t) => t.id === selectedTransport);

    const handlePayment = async () => {
        if (!selectedTransport) {
            setError('Selecciona un tipo de transporte');
            return;
        }

        setIsLoading(true);
        setError('');

        // Simular pago (aquí iría la llamada al backend)
        setTimeout(() => {
            setIsLoading(false);
            router.back();
            // Aquí mostrarías un mensaje de éxito
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pagar Transporte</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Instructions */}
                <Card variant="outlined" style={styles.instructionsCard}>
                    <View style={styles.instructionRow}>
                        <Ionicons name="information-circle-outline" size={24} color={BrandColors.primary} />
                        <Text style={styles.instructionText}>
                            Selecciona el tipo de transporte y confirma el pago
                        </Text>
                    </View>
                </Card>

                {/* Transport Types */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tipo de transporte</Text>
                    {TRANSPORT_TYPES.map((transport) => (
                        <TouchableOpacity
                            key={transport.id}
                            style={[
                                styles.transportCard,
                                selectedTransport === transport.id && styles.transportCardActive,
                            ]}
                            onPress={() => {
                                setSelectedTransport(transport.id);
                                setError('');
                            }}
                        >
                            <View style={styles.transportLeft}>
                                <View
                                    style={[
                                        styles.transportIcon,
                                        selectedTransport === transport.id && styles.transportIconActive,
                                    ]}
                                >
                                    <Ionicons
                                        name={transport.icon}
                                        size={32}
                                        color={
                                            selectedTransport === transport.id
                                                ? BrandColors.primary
                                                : BrandColors.gray[600]
                                        }
                                    />
                                </View>
                                <View>
                                    <Text style={styles.transportName}>{transport.name}</Text>
                                    <Text style={styles.transportFare}>{formatCurrency(transport.fare)}</Text>
                                </View>
                            </View>
                            {selectedTransport === transport.id && (
                                <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Error Message */}
                {error && <ErrorMessage message={error} />}

                {/* Payment Summary */}
                {selectedTransportData && (
                    <Card variant="elevated" style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumen del pago</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tipo de transporte</Text>
                            <Text style={styles.summaryValue}>{selectedTransportData.name}</Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryTotalLabel}>Total a pagar</Text>
                            <Text style={styles.summaryTotalValue}>
                                {formatCurrency(selectedTransportData.fare)}
                            </Text>
                        </View>

                        <View style={styles.balanceInfo}>
                            <Ionicons name="wallet-outline" size={16} color={BrandColors.gray[600]} />
                            <Text style={styles.balanceText}>
                                Saldo disponible: {formatCurrency(50000)}
                            </Text>
                        </View>
                    </Card>
                )}

                {/* QR Code Option */}
                <TouchableOpacity
                    style={styles.qrButton}
                    onPress={() => router.push('/(passenger)/scan-qr' as any)}
                >
                    <Ionicons name="qr-code-outline" size={24} color={BrandColors.primary} />
                    <Text style={styles.qrButtonText}>Escanear código QR</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footer}>
                <Button
                    title={`Pagar ${selectedTransportData ? formatCurrency(selectedTransportData.fare) : ''}`}
                    onPress={handlePayment}
                    loading={isLoading}
                    disabled={!selectedTransport || isLoading}
                    fullWidth
                    size="large"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: 20,
    },
    instructionsCard: {
        padding: 16,
        marginBottom: 24,
        backgroundColor: BrandColors.primary + '10',
        borderColor: BrandColors.primary + '30',
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 12,
    },
    transportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
        marginBottom: 12,
    },
    transportCardActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.gray[50],
    },
    transportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transportIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    transportIconActive: {
        backgroundColor: BrandColors.primary + '20',
    },
    transportName: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    transportFare: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    summaryCard: {
        padding: 20,
        marginBottom: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    summaryDivider: {
        height: 1,
        backgroundColor: BrandColors.gray[200],
        marginVertical: 12,
    },
    summaryTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    summaryTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: BrandColors.gray[50],
        borderRadius: 8,
    },
    balanceText: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.primary,
        borderStyle: 'dashed',
    },
    qrButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.primary,
    },
    footer: {
        padding: 20,
        backgroundColor: BrandColors.white,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[200],
    },
});
