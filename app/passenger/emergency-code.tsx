import { SecurityVerificationModal } from '@/components/SecurityVerificationModal';
import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useCancelEmergencyCode, useGenerateEmergencyCode, usePassengerProfile } from '@/hooks/usePassenger';
import { EmergencyCode } from '@/types';
import { clearEmergencyCode, getEmergencyCode, saveEmergencyCode } from '@/utils/secureStorage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmergencyCodeScreen() {
    const router = useRouter();
    const { data: passengerProfile, isLoading: isProfileLoading } = usePassengerProfile();
    const generateMutation = useGenerateEmergencyCode();
    const cancelMutation = useCancelEmergencyCode();

    // We only keep the code in local state when it's just been generated or revealed
    const [visibleCode, setVisibleCode] = useState<EmergencyCode | null>(null);
    // Whether we are showing the code after auth verification (not freshly generated)
    const [isRevealedCode, setIsRevealedCode] = useState(false);
    // Controls the security verification modal
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // On mount, check if there's a stored code to determine if "Ver código" should be available
    const [hasStoredCode, setHasStoredCode] = useState(false);

    useEffect(() => {
        checkStoredCode();
    }, []);

    const checkStoredCode = async () => {
        const stored = await getEmergencyCode();
        setHasStoredCode(!!stored);
    };

    const handleGenerateCode = async () => {
        // Double check limit
        if ((passengerProfile?.emergencyMonthlyCount || 0) >= 3) {
            Alert.alert('Límite alcanzado', 'Has agotado tus 3 intentos mensuales de generación de código.');
            return;
        }

        try {
            const code = await generateMutation.mutateAsync();
            setVisibleCode(code);
            setIsRevealedCode(false);
            // Save to secure storage for later viewing
            await saveEmergencyCode(code.code, code.expiresAt);
            setHasStoredCode(true);
        } catch (error: any) {
            const message = error.response?.data?.message || 'No se pudo generar el código. Inténtalo de nuevo.';
            Alert.alert('Error', message);
        }
    };

    const handleCancelCode = () => {
        Alert.alert(
            'Invalidar código',
            '¿Estás seguro de que deseas invalidar tu código actual? Esto contará como uno de tus 3 intentos mensuales si decides generar uno nuevo.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Invalidar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelMutation.mutateAsync();
                            setVisibleCode(null);
                            setIsRevealedCode(false);
                            // Clear from secure storage
                            await clearEmergencyCode();
                            setHasStoredCode(false);
                            Alert.alert('Éxito', 'Tu código ha sido invalidado.');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo invalidar el código.');
                        }
                    }
                }
            ]
        );
    };

    const handleRevealCode = () => {
        setShowSecurityModal(true);
    };

    const handleSecuritySuccess = async () => {
        setShowSecurityModal(false);
        const stored = await getEmergencyCode();
        if (stored) {
            setVisibleCode({ code: stored.code, expiresAt: stored.expiresAt });
            setIsRevealedCode(true);
        } else {
            Alert.alert(
                'Código no disponible',
                'No se encontró el código guardado. Es posible que haya sido eliminado o que se haya generado en otro dispositivo.'
            );
        }
    };

    const handleHideCode = () => {
        setVisibleCode(null);
        setIsRevealedCode(false);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    if (isProfileLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const hasActiveCode = passengerProfile?.hasActiveEmergencyCode;
    const monthlyCount = passengerProfile?.emergencyMonthlyCount || 0;
    const remainingAttempts = Math.max(0, 3 - monthlyCount);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Código de Emergencia</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="alert-circle" size={64} color={BrandColors.error} />
                        </View>
                    </View>

                    <Text style={styles.title}>¿Qué es el código de emergencia?</Text>
                    <Text style={styles.description}>
                        Te permite pagar si te quedas sin batería o conexión. Es un recurso vital para emergencias.
                    </Text>

                    <Card variant="outlined" style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Máximo 3 intentos por mes (No acumulables)</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="lock-closed-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Puedes ver tu código verificando tu identidad con PIN o huella</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Válido por 1 solo uso o hasta que expire (30 días)</Text>
                        </View>
                    </Card>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Intentos usados este mes</Text>
                            <Text style={[styles.statValue, { color: monthlyCount >= 3 ? BrandColors.error : BrandColors.primary }]}>
                                {monthlyCount} de 3
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Case 1: Showing a code (freshly generated OR revealed after auth) */}
                {visibleCode ? (
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>
                            {isRevealedCode ? 'Tu código activo es:' : 'Tu NUEVO código es:'}
                        </Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{visibleCode.code}</Text>
                        </View>
                        <Text style={styles.expiryText}>
                            Expira el: {formatDate(visibleCode.expiresAt)}
                        </Text>

                        {!isRevealedCode && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning" size={20} color={BrandColors.warning} />
                                <Text style={styles.warningText}>
                                    ¡ANÓTALO! También podrás verlo después verificando tu identidad con PIN o huella dactilar.
                                </Text>
                            </View>
                        )}

                        {isRevealedCode ? (
                            <Button
                                title="Ocultar código"
                                onPress={handleHideCode}
                                variant="outline"
                                fullWidth
                            />
                        ) : (
                            <Button
                                title="Lo he guardado, volver"
                                onPress={() => router.back()}
                                fullWidth
                            />
                        )}
                    </Animated.View>
                ) : (
                    /* Case 2: Has an active code but it's hidden */
                    hasActiveCode ? (
                        <Animated.View entering={FadeInUp.duration(600)} style={styles.activeCodeState}>
                            <View style={styles.activeCodeBadge}>
                                <Ionicons name="checkmark-circle" size={24} color={BrandColors.success} />
                                <Text style={styles.activeCodeTitle}>Tienes un código vigente</Text>
                            </View>

                            <Text style={styles.activeCodeDescription}>
                                Ya tienes un código de emergencia generado el cual expira el {formatDate(passengerProfile.emergencyCodeExpiresAt)}.
                            </Text>

                            {/* Reveal Code Button */}
                            {hasStoredCode && (
                                <TouchableOpacity
                                    style={styles.revealButton}
                                    onPress={handleRevealCode}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.revealButtonIcon}>
                                        <Ionicons name="eye-outline" size={24} color={BrandColors.white} />
                                    </View>
                                    <View style={styles.revealButtonContent}>
                                        <Text style={styles.revealButtonTitle}>Ver mi código</Text>
                                        <Text style={styles.revealButtonSubtitle}>Verifica tu identidad con PIN o huella</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={BrandColors.primary} />
                                </TouchableOpacity>
                            )}

                            {!hasStoredCode && (
                                <Text style={styles.hiddenCodeMessage}>
                                    El código fue generado en otra sesión o dispositivo. Si lo perdiste, puedes invalidarlo y generar uno nuevo.
                                </Text>
                            )}

                            <View style={styles.actionGroup}>
                                <Button
                                    title="Invalidar código actual"
                                    onPress={handleCancelCode}
                                    variant="outline"
                                    loading={cancelMutation.isPending}
                                    style={styles.cancelBtn}
                                />
                                <Text style={styles.hintText}>
                                    Recuerda: Te quedan {remainingAttempts} intentos este mes.
                                </Text>
                            </View>
                        </Animated.View>
                    ) : (
                        /* Case 3: No active code, show generate button if attempts remaining */
                        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.actionContainer}>
                            {remainingAttempts > 0 ? (
                                <Button
                                    title="Generar Código de Emergencia"
                                    onPress={handleGenerateCode}
                                    loading={generateMutation.isPending}
                                    fullWidth
                                />
                            ) : (
                                <View style={styles.limitReachedBox}>
                                    <Ionicons name="lock-closed" size={32} color={BrandColors.gray[400]} />
                                    <Text style={styles.limitReachedText}>
                                        Has alcanzado el límite de 3 códigos este mes. Por favor espera al próximo mes para generar uno nuevo.
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    )
                )}
            </ScrollView>

            {/* Security Verification Modal */}
            <SecurityVerificationModal
                visible={showSecurityModal}
                onSuccess={handleSecuritySuccess}
                onCancel={() => setShowSecurityModal(false)}
                title="Verificar Identidad"
                subtitle="Para ver tu código de emergencia, confirma tu identidad"
            />
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    scrollContent: {
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: BrandColors.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    infoCard: {
        padding: 20,
        backgroundColor: BrandColors.white,
        marginBottom: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        color: BrandColors.gray[700],
        fontWeight: '500',
        flex: 1,
    },
    actionContainer: {
        marginTop: 8,
    },
    codeContainer: {
        alignItems: 'center',
        backgroundColor: BrandColors.white,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    codeLabel: {
        fontSize: 16,
        color: BrandColors.gray[500],
        marginBottom: 12,
    },
    codeBox: {
        backgroundColor: BrandColors.gray[100],
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BrandColors.primary,
        marginBottom: 12,
    },
    codeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: BrandColors.primary,
        letterSpacing: 4,
    },
    expiryText: {
        fontSize: 14,
        color: BrandColors.gray[500],
        marginBottom: 24,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: BrandColors.warning + '10',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.warning + '30',
        marginBottom: 24,
        gap: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: BrandColors.gray[700],
        lineHeight: 18,
    },
    doneButton: {
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: BrandColors.gray[100],
        borderRadius: 12,
        marginBottom: 24,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    activeCodeState: {
        backgroundColor: BrandColors.white,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        alignItems: 'center',
    },
    activeCodeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    activeCodeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.success,
    },
    activeCodeDescription: {
        fontSize: 15,
        color: BrandColors.gray[700],
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
    },
    revealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: BrandColors.primary + '08',
        borderWidth: 1.5,
        borderColor: BrandColors.primary + '30',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        gap: 12,
    },
    revealButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealButtonContent: {
        flex: 1,
    },
    revealButtonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    revealButtonSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[500],
    },
    hiddenCodeMessage: {
        fontSize: 14,
        color: BrandColors.gray[500],
        fontStyle: 'italic',
        textAlign: 'center',
        backgroundColor: BrandColors.gray[50],
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    actionGroup: {
        width: '100%',
        alignItems: 'center',
    },
    cancelBtn: {
        marginBottom: 12,
    },
    hintText: {
        fontSize: 13,
        color: BrandColors.gray[400],
    },
    limitReachedBox: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: BrandColors.gray[100],
        borderRadius: 20,
        gap: 16,
    },
    limitReachedText: {
        fontSize: 15,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 22,
    },
});
