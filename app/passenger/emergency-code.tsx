import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as passengerService from '@/services/passengerService';
import { EmergencyCode } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
    const [loading, setLoading] = useState(false);
    const [emergencyCode, setEmergencyCode] = useState<EmergencyCode | null>(null);

    const handleGenerateCode = async () => {
        try {
            setLoading(true);
            const code = await passengerService.generateEmergencyCode();
            setEmergencyCode(code);
        } catch (error) {
            console.error('Error generating emergency code:', error);
            Alert.alert('Error', 'No se pudo generar el código de emergencia. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

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
                        Este código te permite pagar tu transporte si no tienes el teléfono incluso si no tienes  conexión a internet o batería en tu teléfono.
                    </Text>

                    <Card variant="outlined" style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Válido por 30 días</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="eye-off-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Solo se muestra una vez</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="copy-outline" size={24} color={BrandColors.primary} />
                            <Text style={styles.infoText}>Guárdalo en un lugar seguro</Text>
                        </View>
                    </Card>
                </Animated.View>

                {!emergencyCode ? (
                    <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.actionContainer}>
                        <Button
                            title="Generar Nuevo Código"
                            onPress={handleGenerateCode}
                            loading={loading}
                            fullWidth
                        />
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>Tu código es:</Text>
                        <View style={styles.codeBox}>
                            <Text style={styles.codeText}>{emergencyCode.code}</Text>
                        </View>
                        <Text style={styles.expiryText}>
                            Expira el: {formatDate(emergencyCode.expiresAt)}
                        </Text>

                        <View style={styles.warningBox}>
                            <Ionicons name="warning" size={20} color={BrandColors.warning} />
                            <Text style={styles.warningText}>
                                Asegúrate de anotar este código ahora. No podrás volver a verlo después de salir de esta pantalla.
                            </Text>
                        </View>

                        <Button
                            title="Entendido, lo he guardado"
                            onPress={() => router.back()}
                            variant="outline"
                            fullWidth
                            style={styles.doneButton}
                        />
                    </Animated.View>
                )}
            </ScrollView>
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
});
