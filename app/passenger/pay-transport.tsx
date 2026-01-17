import { Button, Card, ErrorMessage, Input } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useWalletBalance } from '@/hooks/useWallet';
import { getUserByUsername } from '@/services/usernameService';
import { searchUserByPhone } from '@/services/userService';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRANSPORT_TYPES = [
    { id: 'bus', name: 'Bus', icon: 'bus-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'microbus', name: 'Micro bus', icon: 'bus-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'metro', name: 'Metro', icon: 'train-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'taxi', name: 'Taxi', icon: 'car-outline' as keyof typeof Ionicons.glyphMap },
];

export default function PayTransportScreen() {
    const router = useRouter();
    const { data: balanceData } = useWalletBalance();
    const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [manualType, setManualType] = useState<'none' | 'username' | 'phone'>('none');
    const [manualValue, setManualValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const balance = typeof balanceData?.balance === 'string'
        ? parseFloat(balanceData.balance)
        : (balanceData?.balance || 0);

    const selectedTransportData = TRANSPORT_TYPES.find((t) => t.id === selectedTransport);

    const handleScanQR = () => {
        if (!selectedTransport) {
            setError('Selecciona un tipo de transporte');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            setError('Ingresa un valor válido para el pasaje');
            return;
        }

        if (numericAmount > balance) {
            setError('Saldo insuficiente en tu billetera');
            return;
        }

        setError('');
        router.push({
            pathname: '/passenger/scan-qr' as any,
            params: {
                amount: amount,
                transportType: selectedTransport
            }
        });
    };

    const handleManualContinue = async () => {
        if (!selectedTransport) {
            setError('Selecciona un tipo de transporte');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            setError('Ingresa un valor válido para el pasaje');
            return;
        }

        if (numericAmount > balance) {
            setError('Saldo insuficiente en tu billetera');
            return;
        }

        if (!manualValue) {
            setError(manualType === 'username' ? 'Ingresa el nombre de usuario' : 'Ingresa el número de teléfono');
            return;
        }

        try {
            setIsSearching(true);
            setError('');

            let driver = null;
            if (manualType === 'username') {
                driver = await getUserByUsername(manualValue);
            } else {
                driver = await searchUserByPhone(manualValue);
            }

            if (!driver) {
                setError(manualType === 'username' ? 'Usuario no encontrado' : 'Teléfono no encontrado');
                return;
            }

            // Navigate to confirmation with driver info
            router.push({
                pathname: '/passenger/payment-confirmation' as any,
                params: {
                    amount: amount,
                    transportType: selectedTransport,
                    userId: driver.id.toString(),
                    // We pass these to avoid re-fetching if possible, 
                    // but payment-confirmation will fetch anyway for safety
                }
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al buscar el conductor');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pagar Transporte</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Card variant="outlined" style={styles.instructionsCard}>
                        <View style={styles.instructionRow}>
                            <Ionicons name="information-circle-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.instructionText}>
                                Selecciona el tipo de transporte, ingresa el valor indicado por el conductor e identifícalo para pagar.
                            </Text>
                        </View>
                    </Card>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tipo de transporte</Text>
                        <View style={styles.transportGrid}>
                            {TRANSPORT_TYPES.map((transport) => (
                                <TouchableOpacity
                                    key={transport.id}
                                    style={[
                                        styles.transportGridItem,
                                        selectedTransport === transport.id ? styles.transportGridItemActive : null,
                                    ]}
                                    onPress={() => {
                                        setSelectedTransport(transport.id);
                                        setError('');
                                    }}
                                >
                                    <View
                                        style={[
                                            styles.transportIcon,
                                            selectedTransport === transport.id ? styles.transportIconActive : null,
                                        ]}
                                    >
                                        <Ionicons
                                            name={transport.icon}
                                            size={28}
                                            color={
                                                selectedTransport === transport.id
                                                    ? BrandColors.primary
                                                    : BrandColors.gray[600]
                                            }
                                        />
                                    </View>
                                    <Text style={[
                                        styles.transportName,
                                        selectedTransport === transport.id ? styles.transportNameActive : null
                                    ]}>
                                        {transport.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Valor del pasaje</Text>
                        <Input
                            placeholder="Ej: 2.500"
                            value={amount}
                            onChangeText={(text) => {
                                setAmount(text.replace(/[^0-9]/g, ''));
                                setError('');
                            }}
                            keyboardType="numeric"
                            leftIcon="cash-outline"
                            helperText={`Saldo disponible: ${formatCurrency(balance)}`}
                            error={(error && (error.includes('valor') || error.includes('Saldo'))) ? error : undefined}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Identificación del conductor</Text>
                        <View style={styles.methodSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    manualType === 'none' ? styles.methodButtonActive : null
                                ]}
                                onPress={() => setManualType('none')}
                            >
                                <Ionicons
                                    name="qr-code-outline"
                                    size={20}
                                    color={manualType === 'none' ? BrandColors.white : BrandColors.gray[600]}
                                />
                                <Text style={[
                                    styles.methodButtonText,
                                    manualType === 'none' ? styles.methodButtonTextActive : null
                                ]}>QR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    manualType === 'username' ? styles.methodButtonActive : null
                                ]}
                                onPress={() => setManualType('username')}
                            >
                                <Ionicons
                                    name="at-outline"
                                    size={20}
                                    color={manualType === 'username' ? BrandColors.white : BrandColors.gray[600]}
                                />
                                <Text style={[
                                    styles.methodButtonText,
                                    manualType === 'username' ? styles.methodButtonTextActive : null
                                ]}>Username</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    manualType === 'phone' ? styles.methodButtonActive : null
                                ]}
                                onPress={() => setManualType('phone')}
                            >
                                <Ionicons
                                    name="call-outline"
                                    size={20}
                                    color={manualType === 'phone' ? BrandColors.white : BrandColors.gray[600]}
                                />
                                <Text style={[
                                    styles.methodButtonText,
                                    manualType === 'phone' ? styles.methodButtonTextActive : null
                                ]}>Teléfono</Text>
                            </TouchableOpacity>
                        </View>

                        {manualType !== 'none' ? (
                            <Animated.View entering={FadeInDown.duration(300)}>
                                <Input
                                    placeholder={manualType === 'username' ? "Ej: conductor123" : "Ej: 3001234567"}
                                    value={manualValue}
                                    onChangeText={(text) => {
                                        setManualValue(text);
                                        setError('');
                                    }}
                                    keyboardType={manualType === 'phone' ? "phone-pad" : "default"}
                                    autoCapitalize="none"
                                    leftIcon={manualType === 'username' ? "at-outline" : "call-outline"}
                                    error={(error && (error.includes('usuario') || error.includes('teléfono'))) ? error : undefined}
                                />
                            </Animated.View>
                        ) : null}
                    </View>

                    {!!error && !error.includes('valor') && !error.includes('Saldo') && !error.includes('usuario') && !error.includes('teléfono') ? (
                        <ErrorMessage message={error} />
                    ) : null}

                    {!!selectedTransportData && !!amount && !isNaN(parseFloat(amount)) ? (
                        <Animated.View entering={FadeInDown.duration(400)}>
                            <Card variant="elevated" style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total a pagar</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(parseFloat(amount))}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Transporte</Text>
                                    <Text style={styles.summaryValue}>{selectedTransportData.name}</Text>
                                </View>
                            </Card>
                        </Animated.View>
                    ) : null}

                    <View style={styles.footer}>
                        <Button
                            title={manualType === 'none' ? "Escanear Código QR" : "Continuar al Pago"}
                            onPress={manualType === 'none' ? handleScanQR : handleManualContinue}
                            icon={
                                <Ionicons
                                    name={manualType === 'none' ? "qr-code-outline" : "arrow-forward-outline"}
                                    size={20}
                                    color={BrandColors.white}
                                />
                            }
                            fullWidth
                            size="large"
                            loading={isSearching}
                            disabled={!selectedTransport || !amount || (manualType !== 'none' && !manualValue)}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    transportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    transportGridItem: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: BrandColors.gray[200],
    },
    transportGridItemActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primary + '05',
    },
    transportIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    transportIconActive: {
        backgroundColor: BrandColors.primary + '20',
    },
    transportName: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
    },
    transportNameActive: {
        color: BrandColors.primary,
    },
    summaryCard: {
        padding: 16,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: BrandColors.gray[600],
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    footer: {
        marginVertical: 30,
    },
    methodSelector: {
        flexDirection: 'row',
        backgroundColor: BrandColors.gray[100],
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    methodButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    methodButtonActive: {
        backgroundColor: BrandColors.primary,
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    methodButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: BrandColors.gray[600],
    },
    methodButtonTextActive: {
        color: BrandColors.white,
    },
});
