import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useCreateWithdrawalMethod, useDeleteWithdrawalMethod, useUpdateWithdrawalMethod, useWithdrawalMethods } from '@/hooks/useWithdrawalMethods';
import { WithdrawalMethod, WithdrawalMethodType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WithdrawalMethodsScreen() {
    const router = useRouter();
    const { data: methods, isLoading, refetch } = useWithdrawalMethods();
    const createMutation = useCreateWithdrawalMethod();
    const updateMutation = useUpdateWithdrawalMethod();
    const deleteMutation = useDeleteWithdrawalMethod();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newMethod, setNewMethod] = useState({
        type: WithdrawalMethodType.BANK_ACCOUNT,
        bankName: '',
        accountNumber: '',
        accountType: 'Ahorros',
        holderName: '',
        holderDni: '',
    });

    const handleSetDefault = (id: string) => {
        updateMutation.mutate({ id, dto: { isDefault: true } });
    };

    const handleDelete = (id: string, isDefault: boolean) => {
        if (isDefault) {
            Alert.alert('Error', 'No puedes eliminar el método de retiro por defecto.');
            return;
        }

        Alert.alert(
            'Eliminar método de retiro',
            '¿Estás seguro que deseas eliminar este método de retiro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(id),
                },
            ]
        );
    };

    const handleCreate = () => {
        if (!newMethod.accountNumber || !newMethod.holderName || !newMethod.holderDni) {
            Alert.alert('Error', 'Por favor completa todos los campos obligatorios.');
            return;
        }

        createMutation.mutate(newMethod, {
            onSuccess: () => {
                setIsModalVisible(false);
                setNewMethod({
                    type: WithdrawalMethodType.BANK_ACCOUNT,
                    bankName: '',
                    accountNumber: '',
                    accountType: 'Ahorros',
                    holderName: '',
                    holderDni: '',
                });
            },
        });
    };

    const getIcon = (type: WithdrawalMethodType) => {
        switch (type) {
            case WithdrawalMethodType.BANK_ACCOUNT:
                return 'business-outline';
            case WithdrawalMethodType.NEQUI:
                return 'phone-portrait-outline';
            case WithdrawalMethodType.DAVIPLATA:
                return 'wallet-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const getLabel = (method: WithdrawalMethod) => {
        if (method.type === WithdrawalMethodType.BANK_ACCOUNT) {
            return `${method.bankName} - ${method.accountNumber}`;
        }
        return `${method.type} - ${method.accountNumber}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Cargando métodos de retiro...</Text>
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
                <Text style={styles.headerTitle}>Métodos de Retiro</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    <Text style={styles.introText}>
                        Configura tus cuentas bancarias o billeteras digitales para recibir tus ganancias.
                    </Text>
                </Animated.View>

                {methods && methods.length > 0 ? (
                    methods.map((method, index) => (
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
                                        <Text style={styles.methodHolder}>{method.holderName}</Text>
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
                        <Ionicons name="wallet-outline" size={64} color={BrandColors.gray[200]} />
                        <Text style={styles.emptyText}>No tienes métodos de retiro registrados.</Text>
                    </View>
                )}

                <Button
                    title="Agregar Método de Retiro"
                    onPress={() => setIsModalVisible(true)}
                    style={styles.addButton}
                    icon={<Ionicons name="add" size={20} color={BrandColors.white} />}
                />
            </ScrollView>

            {/* Add Method Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nuevo Método de Retiro</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={BrandColors.gray[900]} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Tipo de Cuenta</Text>
                            <View style={styles.typeSelector}>
                                {Object.values(WithdrawalMethodType).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeOption,
                                            newMethod.type === type && styles.typeOptionActive
                                        ]}
                                        onPress={() => setNewMethod({ ...newMethod, type })}
                                    >
                                        <Text style={[
                                            styles.typeOptionText,
                                            newMethod.type === type && styles.typeOptionTextActive
                                        ]}>{type.replace('_', ' ')}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {newMethod.type === WithdrawalMethodType.BANK_ACCOUNT && (
                                <>
                                    <Text style={styles.label}>Banco</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej: Bancolombia"
                                        value={newMethod.bankName}
                                        onChangeText={(text) => setNewMethod({ ...newMethod, bankName: text })}
                                    />
                                    <Text style={styles.label}>Tipo de Cuenta</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej: Ahorros"
                                        value={newMethod.accountType}
                                        onChangeText={(text) => setNewMethod({ ...newMethod, accountType: text })}
                                    />
                                </>
                            )}

                            <Text style={styles.label}>Número de Cuenta / Celular</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Número"
                                keyboardType="numeric"
                                value={newMethod.accountNumber}
                                onChangeText={(text) => setNewMethod({ ...newMethod, accountNumber: text })}
                            />

                            <Text style={styles.label}>Nombre del Titular</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre completo"
                                value={newMethod.holderName}
                                onChangeText={(text) => setNewMethod({ ...newMethod, holderName: text })}
                            />

                            <Text style={styles.label}>Documento de Identidad (DNI)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Número de documento"
                                keyboardType="numeric"
                                value={newMethod.holderDni}
                                onChangeText={(text) => setNewMethod({ ...newMethod, holderDni: text })}
                            />

                            <Button
                                title="Guardar Método"
                                onPress={handleCreate}
                                loading={createMutation.isPending}
                                style={styles.saveButton}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    methodHolder: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginTop: 2,
    },
    defaultBadge: {
        backgroundColor: BrandColors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 6,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: BrandColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    modalForm: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: BrandColors.gray[50],
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: BrandColors.gray[900],
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: BrandColors.gray[100],
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeOptionActive: {
        backgroundColor: BrandColors.primary + '15',
        borderColor: BrandColors.primary,
    },
    typeOptionText: {
        fontSize: 13,
        color: BrandColors.gray[600],
        fontWeight: '500',
    },
    typeOptionTextActive: {
        color: BrandColors.primary,
        fontWeight: 'bold',
    },
    saveButton: {
        marginTop: 32,
        marginBottom: 20,
    },
});
