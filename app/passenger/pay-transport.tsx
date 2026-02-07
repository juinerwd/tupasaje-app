import { Button, Card, ErrorMessage, Input } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useWalletBalance } from '@/hooks/useWallet';
import { getUserByUsername } from '@/services/usernameService';
import { searchUserByPhone } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRANSPORT_TYPES = [
    { id: 'bus', name: 'Bus', icon: 'bus-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'microbus', name: 'Micro bus', icon: 'bus-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'metro', name: 'Metro', icon: 'train-outline' as keyof typeof Ionicons.glyphMap },
    { id: 'taxi', name: 'Taxi', icon: 'car-outline' as keyof typeof Ionicons.glyphMap },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function PayTransportScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: balanceData } = useWalletBalance();

    // UI State
    const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');

    // Form State (for Manual or after Scan)
    const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [manualMethod, setManualMethod] = useState<'username' | 'phone'>('username');
    const [manualValue, setManualValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const balance = typeof balanceData?.balance === 'string'
        ? parseFloat(balanceData.balance)
        : (balanceData?.balance || 0);

    const handleOpenScanner = () => {
        // Validar perfil completo
        if (user && !user.profileCompleted) {
            Alert.alert(
                'Perfil Incompleto',
                'Debes completar tu información personal para realizar pagos.',
                [
                    { text: 'Ahora no', style: 'cancel' },
                    { text: 'Completar Perfil', onPress: () => router.push('/passenger/edit-profile') }
                ]
            );
            return;
        }

        router.push('/passenger/scan-qr' as any);
    };

    const handleManualContinue = async () => {
        // Validar perfil completo
        if (user && !user.profileCompleted) {
            Alert.alert(
                'Perfil Incompleto',
                'Debes completar tu información personal para realizar pagos.',
                [
                    { text: 'Ahora no', style: 'cancel' },
                    { text: 'Completar Perfil', onPress: () => router.push('/passenger/edit-profile') }
                ]
            );
            return;
        }

        if (!selectedTransport) {
            setError('Selecciona un tipo de transporte');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            setError('Ingresa un valor válido');
            return;
        }

        if (numericAmount > balance) {
            setError('Saldo insuficiente');
            return;
        }

        if (!manualValue) {
            setError(manualMethod === 'username' ? 'Ingresa el usuario' : 'Ingresa el teléfono');
            return;
        }

        try {
            setIsSearching(true);
            setError('');

            let driver = null;
            if (manualMethod === 'username') {
                driver = await getUserByUsername(manualValue);
            } else {
                driver = await searchUserByPhone(manualValue);
            }

            if (!driver) {
                setError('Conductor no encontrado');
                return;
            }

            router.push({
                pathname: '/passenger/payment-confirmation' as any,
                params: {
                    amount: amount,
                    transportType: selectedTransport,
                    userId: driver.id.toString(),
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
            <LinearGradient
                colors={[BrandColors.primary, BrandColors.primaryDark]}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Pagar Transporte</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
                        onPress={() => setActiveTab('scan')}
                    >
                        <Ionicons
                            name="qr-code-outline"
                            size={20}
                            color={activeTab === 'scan' ? BrandColors.primary : BrandColors.white}
                        />
                        <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
                            Escáner
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
                        onPress={() => setActiveTab('manual')}
                    >
                        <Ionicons
                            name="create-outline"
                            size={20}
                            color={activeTab === 'manual' ? BrandColors.primary : BrandColors.white}
                        />
                        <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                            Manual
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {activeTab === 'scan' ? (
                        <View style={styles.tabContent}>
                            <AnimatedTouchable
                                entering={FadeInDown.delay(100).springify()}
                                style={styles.scanCard}
                                onPress={handleOpenScanner}
                                activeOpacity={0.8}
                            >
                                <View style={styles.scanIconContainer}>
                                    <Ionicons name="scan" size={48} color={BrandColors.primary} />
                                </View>
                                <Text style={styles.scanTitle}>Escanear Código QR</Text>
                                <Text style={styles.scanSubtitle}>
                                    Paga rápidamente escaneando el código en el vehículo
                                </Text>
                            </AnimatedTouchable>

                            <Card variant="outlined" style={styles.instructionsCard}>
                                <View style={styles.instructionRow}>
                                    <Ionicons name="information-circle-outline" size={24} color={BrandColors.primary} />
                                    <Text style={styles.instructionText}>
                                        Apunta tu cámara al código QR del conductor. Luego podrás ingresar el valor del pasaje.
                                    </Text>
                                </View>
                            </Card>
                        </View>
                    ) : (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContent}>
                            <Text style={styles.sectionTitle}>Tipo de transporte</Text>
                            <View style={styles.transportGrid}>
                                {TRANSPORT_TYPES.map((transport) => (
                                    <TouchableOpacity
                                        key={transport.id}
                                        style={[
                                            styles.transportGridItem,
                                            selectedTransport === transport.id ? styles.transportGridItemActive : null,
                                        ]}
                                        onPress={() => setSelectedTransport(transport.id)}
                                    >
                                        <Ionicons
                                            name={transport.icon}
                                            size={24}
                                            color={selectedTransport === transport.id ? BrandColors.primary : BrandColors.gray[500]}
                                        />
                                        <Text style={[styles.transportName, selectedTransport === transport.id && styles.transportNameActive]}>
                                            {transport.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionTitle}>Datos del pago</Text>
                            <Input
                                placeholder="Valor del pasaje"
                                value={amount}
                                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                leftIcon="cash-outline"
                                helperText={`Saldo: ${formatCurrency(balance)}`}
                            />

                            <View style={styles.methodSelector}>
                                <TouchableOpacity
                                    style={[styles.methodBtn, manualMethod === 'username' && styles.methodBtnActive]}
                                    onPress={() => setManualMethod('username')}
                                >
                                    <Text style={[styles.methodBtnText, manualMethod === 'username' && styles.methodBtnTextActive]}>Username</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.methodBtn, manualMethod === 'phone' && styles.methodBtnActive]}
                                    onPress={() => setManualMethod('phone')}
                                >
                                    <Text style={[styles.methodBtnText, manualMethod === 'phone' && styles.methodBtnTextActive]}>Teléfono</Text>
                                </TouchableOpacity>
                            </View>

                            <Input
                                placeholder={manualMethod === 'username' ? "@usuario" : "Número de celular"}
                                value={manualValue}
                                onChangeText={setManualValue}
                                leftIcon={manualMethod === 'username' ? "at-outline" : "call-outline"}
                                autoCapitalize="none"
                            />

                            {error ? <ErrorMessage message={error} /> : null}

                            <Button
                                title="Continuar al Pago"
                                onPress={handleManualContinue}
                                loading={isSearching}
                                disabled={!selectedTransport || !amount || !manualValue}
                                fullWidth
                                style={{ marginTop: 10 }}
                            />
                        </Animated.View>
                    )}
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
    gradient: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
        textAlign: 'center',
    },
    tabs: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    tabActive: {
        backgroundColor: BrandColors.white,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.white,
    },
    tabTextActive: {
        color: BrandColors.primary,
    },
    content: {
        padding: 20,
    },
    tabContent: {
        gap: 20,
    },
    scanCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    scanIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BrandColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    scanSubtitle: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    instructionsCard: {
        padding: 16,
    },
    instructionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[600],
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[800],
        marginBottom: 8,
    },
    transportGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    transportGridItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    transportGridItemActive: {
        borderColor: BrandColors.primary,
        backgroundColor: BrandColors.primary + '05',
    },
    transportName: {
        fontSize: 14,
        color: BrandColors.gray[700],
    },
    transportNameActive: {
        fontWeight: '600',
        color: BrandColors.primary,
    },
    methodSelector: {
        flexDirection: 'row',
        backgroundColor: BrandColors.gray[200],
        padding: 4,
        borderRadius: 10,
        marginBottom: 12,
    },
    methodBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    methodBtnActive: {
        backgroundColor: BrandColors.white,
    },
    methodBtnText: {
        fontSize: 13,
        color: BrandColors.gray[600],
    },
    methodBtnTextActive: {
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
});

