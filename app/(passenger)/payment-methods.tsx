import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useDeletePaymentMethod, usePaymentMethods, useUpdatePaymentMethod } from '@/hooks/usePaymentMethods';
import { PaymentMethod, PaymentMethodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const { data: paymentMethods, isLoading, error, refetch } = usePaymentMethods();
    const updatePaymentMethodMutation = useUpdatePaymentMethod();
    const deletePaymentMethodMutation = useDeletePaymentMethod();

    const handleSetDefault = (id: string) => {
        updatePaymentMethodMutation.mutate({ id, dto: { isDefault: true } });
    };

    const handleDelete = (id: string, isDefault: boolean) => {
        if (isDefault) {
            Alert.alert('Error', 'No puedes eliminar el método de pago por defecto.');
            return;
        }

        Alert.alert(
            'Eliminar método de pago',
            '¿Estás seguro que deseas eliminar este método de pago?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deletePaymentMethodMutation.mutate(id),
                },
            ]
        );
    };

    const getIcon = (type: PaymentMethodType) => {
        switch (type) {
            case PaymentMethodType.CARD:
                return 'card-outline';
            case PaymentMethodType.PSE:
                return 'business-outline';
            case PaymentMethodType.NEQUI:
                return 'phone-portrait-outline';
            case PaymentMethodType.BANCOLOMBIA:
                return 'briefcase-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const getLabel = (method: PaymentMethod) => {
        if (method.type === PaymentMethodType.CARD) {
            return `${method.cardBrand?.toUpperCase()} **** ${method.cardLast4}`;
        }
        return method.type;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Cargando métodos de pago...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Métodos de Pago</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    <Text style={styles.introText}>
                        Administra tus tarjetas y otros medios de pago para tus viajes y recargas.
                    </Text>
                </Animated.View>

                {paymentMethods && paymentMethods.length > 0 ? (
                    paymentMethods.map((method, index) => (
                        <Animated.View
                            key={method.id}
                            entering={FadeInDown.delay(100 * (index + 1)).duration(600)}
                        >
                            <Card variant="outlined" style={styles.methodCard}>
                                <View style={styles.methodContent}>
                                    <View style={[styles.iconContainer, { backgroundColor: BrandColors.primary + '15' }]}>
                                        <Ionicons name={getIcon(method.type)} size={24} color={BrandColors.primary} />
                                    </View>
                                    <View style={styles.methodInfo}>
                                        <Text style={styles.methodLabel}>{getLabel(method)}</Text>
                                        {method.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>Principal</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.actions}>
                                        {!method.isDefault && (
                                            <TouchableOpacity
                                                onPress={() => handleSetDefault(method.id)}
                                                style={styles.actionButton}
                                            >
                                                <Ionicons name="star-outline" size={20} color={BrandColors.gray[400]} />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => handleDelete(method.id, method.isDefault)}
                                            style={styles.actionButton}
                                        >
                                            <Ionicons name="trash-outline" size={20} color={BrandColors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Card>
                        </Animated.View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="card-outline" size={64} color={BrandColors.gray[200]} />
                        <Text style={styles.emptyText}>No tienes métodos de pago registrados.</Text>
                    </View>
                )}

                <Button
                    title="Agregar Método de Pago"
                    onPress={() => Alert.alert('Próximamente', 'La integración con Wompi para agregar tarjetas estará disponible pronto.')}
                    style={styles.addButton}
                    icon={<Ionicons name="add" size={20} color={BrandColors.white} />}
                />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introText: {
        fontSize: 15,
        color: BrandColors.gray[600],
        marginBottom: 24,
        lineHeight: 22,
    },
    methodCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
    },
    methodContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodInfo: {
        flex: 1,
    },
    methodLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    defaultBadge: {
        backgroundColor: BrandColors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    defaultBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[400],
        textAlign: 'center',
    },
    addButton: {
        marginTop: 24,
    },
});
