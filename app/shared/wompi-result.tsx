import { BrandColors } from '@/constants/theme';
import { useRechargeTransaction } from '@/hooks/useRecharge';
import { useAuthStore } from '@/store/authStore';
import { TransactionStatus, UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WompiResultScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { id } = useLocalSearchParams<{
        id: string;      // Wompi Transaction ID
    }>();

    // Fetch real status from backend (it will poll until completed/failed)
    const { data: transaction, isLoading, error } = useRechargeTransaction(id || '');

    const handleGoHome = () => {
        const path = user?.role === UserRole.DRIVER ? '/conductor/dashboard' : '/passenger/dashboard';
        router.replace(path as any);
    };

    const handleRetry = () => {
        router.replace('/passenger/recharge' as any);
    };

    // Determine status based on transaction data
    const isApproved = transaction?.status === TransactionStatus.COMPLETED;
    const isProcessing = transaction?.status === TransactionStatus.PROCESSING;
    const isFailed = transaction?.status === TransactionStatus.FAILED;
    const isPending = !transaction || (isProcessing && !error);

    if (isLoading || isPending) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Verificando pago...</Text>
                    <Text style={styles.subLoadingText}>Estamos confirmando con Wompi, esto puede tardar un momento.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scroll}>
                
                <Animated.View 
                    entering={FadeInDown.springify()}
                    style={styles.iconBox}
                >
                    <View style={[
                        styles.iconBg, 
                        { backgroundColor: isApproved ? BrandColors.success + '15' : BrandColors.danger + '20' }
                    ]}>
                        <Ionicons 
                            name={isApproved ? "checkmark-circle" : "alert-circle"} 
                            size={80} 
                            color={isApproved ? BrandColors.success : BrandColors.danger} 
                        />
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.delay(200).springify()}
                    style={styles.textGroup}
                >
                    <Text style={styles.title}>
                        {isApproved ? '¡Recarga Exitosa!' : 'Pago no completado'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isApproved 
                            ? 'Tu saldo ha sido actualizado. Ya puedes seguir usando Tu Pasaje.' 
                            : isFailed 
                                ? 'La transacción no pudo completarse. Por favor revisa con tu banco o intenta otro medio.'
                                : 'No logramos confirmar el estado final. Si el pago fue descontado de tu cuenta, tu saldo se actualizará automáticamente en unos minutos.'}
                    </Text>
                </Animated.View>

                <Animated.View 
                    entering={FadeInUp.delay(400).springify()}
                    style={styles.card}
                >
                    <Text style={styles.cardTitle}>Detalles de la Transacción</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Referencia</Text>
                        <Text style={styles.value}>{transaction?.reference || transaction?.wompiReference || 'Pendiente'}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Estado del Sistema</Text>
                        <Text style={[styles.value, { color: isApproved ? BrandColors.success : BrandColors.danger }]}>
                            {transaction?.status || 'SIN INFORMACIÓN'}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>ID Wompi</Text>
                        <Text style={styles.value}>{id}</Text>
                    </View>

                    <View style={styles.divider} />
                    
                    <Text style={styles.footerNote}>
                        {isApproved 
                            ? 'La transacción ha sido procesada correctamente.'
                            : 'Este ID es tu comprobante ante cualquier duda con soporte técnico.'}
                    </Text>
                </Animated.View>

            </ScrollView>

            <View style={styles.footer}>
                {!isApproved && (
                    <TouchableOpacity style={styles.btnSecondary} onPress={handleRetry}>
                        <Text style={styles.btnTextSecondary}>Intentar de nuevo</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.btnPrimary} onPress={handleGoHome}>
                    <Text style={styles.btnTextPrimary}>Ir al Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BrandColors.white },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 15, color: BrandColors.gray[900], fontSize: 18, fontWeight: 'bold' },
    subLoadingText: { marginTop: 5, color: BrandColors.gray[500], fontSize: 14 },
    scroll: { padding: 25, alignItems: 'center' },
    iconBox: { marginTop: 40, marginBottom: 20 },
    iconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    textGroup: { alignItems: 'center', marginBottom: 35 },
    title: { fontSize: 26, fontWeight: 'bold', color: BrandColors.gray[900], marginBottom: 10 },
    subtitle: { fontSize: 16, color: BrandColors.gray[600], textAlign: 'center', lineHeight: 22 },
    card: { width: '100%', backgroundColor: BrandColors.gray[50], borderRadius: 20, padding: 20 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: BrandColors.gray[800], marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { color: BrandColors.gray[600], fontSize: 14 },
    value: { fontWeight: '600', color: BrandColors.gray[900], fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 10 },
    divider: { height: 1, backgroundColor: BrandColors.gray[200], marginVertical: 15 },
    footerNote: { fontSize: 12, color: BrandColors.gray[500], textAlign: 'center', fontStyle: 'italic' },
    footer: { padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: BrandColors.gray[100] },
    btnPrimary: { backgroundColor: BrandColors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    btnTextPrimary: { color: BrandColors.white, fontSize: 16, fontWeight: 'bold' },
    btnSecondary: { borderWidth: 1, borderColor: BrandColors.gray[300], paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    btnTextSecondary: { color: BrandColors.gray[700], fontSize: 16, fontWeight: '600' },
});
