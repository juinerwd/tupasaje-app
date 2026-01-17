import { QRScannerModal } from '@/components/QRScannerModal';
import { Input } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useTransferFunds } from '@/hooks/useRecharge';
import { useWalletBalance } from '@/hooks/useWallet';
import { scanQRCode } from '@/services/usernameService';
import { searchUserByPhone } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TransferScreen() {
    const router = useRouter();
    const { data: balanceData } = useWalletBalance();
    const transferFunds = useTransferFunds();
    const currentUser = useAuthStore(state => state.user);

    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [recipient, setRecipient] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isScannerVisible, setIsScannerVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const balance = typeof balanceData?.balance === 'string'
        ? parseFloat(balanceData.balance)
        : (balanceData?.balance || 0);

    const maskName = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(word => {
            if (word.length === 0) return '';
            const visiblePart = word.substring(0, 3);
            return `${visiblePart}***`;
        }).join(' ');
    };

    const handleSearchUser = async () => {
        if (phone.length < 10) {
            setError('Ingresa un número de teléfono válido');
            return;
        }

        if (currentUser?.phoneNumber === phone) {
            setError('No puedes transferir dinero a tu propia cuenta');
            return;
        }

        setIsSearching(true);
        setError(null);
        setRecipient(null);

        try {
            const user = await searchUserByPhone(phone);
            if (user) {
                setRecipient(user);
            } else {
                setError('Usuario no encontrado');
            }
        } catch (err) {
            setError('Error al buscar el usuario');
        } finally {
            setIsSearching(false);
        }
    };

    const handleQRScan = async (data: string) => {
        setIsScannerVisible(false);
        setIsSearching(true);
        setError(null);
        setRecipient(null);

        try {
            const result = await scanQRCode(data);
            if (result && result.phoneNumber) {
                setPhone(result.phoneNumber);
                if (currentUser?.phoneNumber === result.phoneNumber) {
                    setError('No puedes transferir dinero a tu propia cuenta');
                    setIsSearching(false);
                    return;
                }
                // The scanQRCode might return the full user object or just the data
                // To be safe and consistent, we use the phone number to search
                const user = await searchUserByPhone(result.phoneNumber);
                if (user) {
                    setRecipient(user);
                } else {
                    setError('Usuario no encontrado');
                }
            } else {
                setError('Código QR no válido');
            }
        } catch (err) {
            setError('Error al procesar el código QR');
        } finally {
            setIsSearching(false);
        }
    };

    const handleTransfer = async () => {
        if (!recipient) return;

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Ingresa un monto válido');
            return;
        }

        if (numericAmount > balance) {
            setError('Saldo insuficiente');
            return;
        }

        Alert.alert(
            'Confirmar Transferencia',
            `¿Estás seguro que deseas transferir ${formatCurrency(numericAmount)} a ${recipient.fullName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Transferir',
                    onPress: async () => {
                        try {
                            await transferFunds.mutateAsync({
                                toUserId: recipient.id,
                                amount: numericAmount,
                                description,
                            });
                            Alert.alert('¡Éxito!', 'Transferencia realizada correctamente', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Error al realizar la transferencia');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[BrandColors.primary, BrandColors.primaryDark, '#014d1e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Transferir</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View
                        entering={FadeInDown.duration(800)}
                        style={styles.balanceSection}
                    >
                        <Text style={styles.balanceLabel}>Saldo disponible</Text>
                        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.cardContainer}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-add-outline" size={20} color={BrandColors.primary} />
                            <Text style={styles.sectionTitle}>¿A quién envías?</Text>
                        </View>

                        <Text style={styles.descriptionText}>
                            Envía dinero de forma instantánea a otros usuarios de TuPasaje usando solo su número de teléfono.
                        </Text>

                        <View style={styles.searchContainer}>
                            <Input
                                placeholder="Número de teléfono"
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text.replace(/[^0-9]/g, ''));
                                    setError(null);
                                    if (recipient) setRecipient(null);
                                }}
                                keyboardType="phone-pad"
                                maxLength={10}
                                leftIcon="call-outline"
                                containerStyle={{ flex: 1, marginBottom: 0 }}
                                inputContainerStyle={styles.unifiedInputContainer}
                                style={styles.unifiedInput}
                            />
                            <TouchableOpacity
                                onPress={() => setIsScannerVisible(true)}
                                style={styles.qrScanButton}
                            >
                                <Ionicons name="qr-code-outline" size={24} color={BrandColors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSearchUser}
                                style={[styles.unifiedSearchButton, isSearching && styles.searchButtonDisabled]}
                                disabled={isSearching || phone.length < 10}
                            >
                                {isSearching ? (
                                    <ActivityIndicator size="small" color={BrandColors.white} />
                                ) : (
                                    <Ionicons name="search" size={20} color={BrandColors.white} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {error && !recipient && (
                            <Animated.Text entering={FadeInLeft} style={styles.errorText}>{error}</Animated.Text>
                        )}

                        {recipient && (
                            <Animated.View entering={FadeInDown.duration(400)} style={styles.recipientCard}>
                                <LinearGradient
                                    colors={[BrandColors.white, BrandColors.gray[50]]}
                                    style={styles.recipientGradient}
                                >
                                    <View style={styles.recipientAvatar}>
                                        <Text style={styles.recipientInitials}>
                                            {recipient.firstName[0]}{recipient.lastName[0]}
                                        </Text>
                                    </View>
                                    <View style={styles.recipientInfo}>
                                        <Text style={styles.recipientName}>{maskName(recipient.fullName)}</Text>
                                        <Text style={styles.recipientPhone}>{recipient.phoneNumber}</Text>
                                    </View>
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={24} color={BrandColors.success} />
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {recipient && (
                        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Monto a transferir</Text>
                            <View style={styles.amountInputContainer}>
                                <Text style={styles.amountCurrency}>$</Text>
                                <Input
                                    placeholder="0"
                                    value={amount}
                                    onChangeText={(text) => {
                                        setAmount(text.replace(/[^0-9]/g, ''));
                                        setError(null);
                                    }}
                                    keyboardType="numeric"
                                    style={styles.amountInput}
                                    containerStyle={styles.amountInputWrapper}
                                />
                            </View>

                            <View style={styles.descriptionContainer}>
                                <Input
                                    placeholder="¿Para qué es este envío? (Opcional)"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={2}
                                    style={styles.descriptionInput}
                                />
                            </View>

                            {error && recipient && (
                                <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 16 }]}>{error}</Text>
                            )}

                            <TouchableOpacity
                                style={[styles.transferButton, (!amount || parseFloat(amount) <= 0) && styles.transferButtonDisabled]}
                                onPress={handleTransfer}
                                disabled={transferFunds.isPending || !amount || parseFloat(amount) <= 0}
                            >
                                <LinearGradient
                                    colors={[BrandColors.primary, BrandColors.primaryDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {transferFunds.isPending ? (
                                        <ActivityIndicator color={BrandColors.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.transferButtonText}>Confirmar Envío</Text>
                                            <Ionicons name="send" size={18} color={BrandColors.white} style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <QRScannerModal
                visible={isScannerVisible}
                onClose={() => setIsScannerVisible(false)}
                onScan={handleQRScan}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    headerGradient: {
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
        letterSpacing: 0.5,
    },
    balanceSection: {
        alignItems: 'center',
        marginTop: 10,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.white,
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 24,
    },
    cardContainer: {
        backgroundColor: BrandColors.white,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: BrandColors.gray[800],
    },
    descriptionText: {
        fontSize: 14,
        color: BrandColors.gray[500],
        lineHeight: 20,
        marginBottom: 20,
    },
    unifiedInputContainer: {
        backgroundColor: BrandColors.gray[50],
        borderColor: BrandColors.gray[200],
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    qrScanButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: BrandColors.white,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    unifiedInput: {
        fontSize: 16,
        color: BrandColors.gray[900],
    },
    unifiedSearchButton: {
        backgroundColor: BrandColors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        color: BrandColors.white,
        marginLeft: 8,
    },
    searchButtonDisabled: {
        backgroundColor: BrandColors.gray[300],
        shadowOpacity: 0,
        elevation: 0,
    },
    errorText: {
        color: BrandColors.error,
        fontSize: 13,
        marginTop: 8,
        fontWeight: '500',
    },
    recipientCard: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    recipientGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    recipientAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    recipientInitials: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    recipientInfo: {
        flex: 1,
    },
    recipientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    recipientPhone: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
    verifiedBadge: {
        padding: 4,
    },
    amountSection: {
        alignItems: 'center',
        paddingTop: 10,
    },
    amountLabel: {
        fontSize: 15,
        color: BrandColors.gray[600],
        fontWeight: '600',
        marginBottom: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        width: '100%',
    },
    amountCurrency: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginRight: 8,
    },
    amountInputWrapper: {
        flex: 1,
        maxWidth: 280,
        borderBottomWidth: 0,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
        height: 80,
        paddingVertical: 0,
    },
    descriptionContainer: {
        width: '100%',
        backgroundColor: BrandColors.white,
        borderRadius: 20,
        padding: 8,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    descriptionInput: {
        fontSize: 15,
        color: BrandColors.gray[800],
        minHeight: 60,
    },
    transferButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: BrandColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    transferButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    transferButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.white,
        letterSpacing: 0.5,
    },
});
