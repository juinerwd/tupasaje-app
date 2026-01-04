import { Button, Input } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistration } from '@/hooks/useRegistration';
import { ID_TYPES } from '@/types';
import { PersonalDataFormData, personalDataSchema } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function Step3PersonalData() {
    const { personalData, setPersonalData, nextStep } = useRegistration();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<PersonalDataFormData>({
        resolver: zodResolver(personalDataSchema),
        defaultValues: {
            firstName: personalData?.firstName || '',
            lastName: personalData?.lastName || '',
            idType: personalData?.idType || '',
            idNumber: personalData?.idNumber || '',
            email: personalData?.email || '',
        },
    });

    const onSubmit = (data: PersonalDataFormData) => {
        setPersonalData(data);
        nextStep();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Title */}
                    <Text style={styles.title}>Datos personales</Text>
                    <Text style={styles.subtitle}>
                        Completa tu información personal
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* First Name */}
                        <Controller
                            control={control}
                            name="firstName"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Nombre(s)"
                                    placeholder="Juan"
                                    leftIcon="person-outline"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.firstName?.message}
                                />
                            )}
                        />

                        {/* Last Name */}
                        <Controller
                            control={control}
                            name="lastName"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Apellido(s)"
                                    placeholder="Pérez"
                                    leftIcon="person-outline"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.lastName?.message}
                                />
                            )}
                        />

                        {/* ID Type */}
                        <Controller
                            control={control}
                            name="idType"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.pickerContainer}>
                                    <Text style={styles.pickerLabel}>Tipo de identificación</Text>
                                    <View
                                        style={[
                                            styles.pickerWrapper,
                                            errors.idType && styles.pickerWrapperError,
                                        ]}
                                    >
                                        <Picker
                                            selectedValue={value}
                                            onValueChange={onChange}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Selecciona..." value="" />
                                            {ID_TYPES.map((type) => (
                                                <Picker.Item
                                                    key={type.value}
                                                    label={type.label}
                                                    value={type.value}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    {errors.idType && (
                                        <Text style={styles.errorText}>{errors.idType.message}</Text>
                                    )}
                                </View>
                            )}
                        />

                        {/* ID Number */}
                        <Controller
                            control={control}
                            name="idNumber"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Número de identificación"
                                    placeholder="1234567890"
                                    keyboardType="default"
                                    leftIcon="card-outline"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.idNumber?.message}
                                />
                            )}
                        />

                        {/* Email */}
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <Input
                                    label="Correo electrónico"
                                    placeholder="correo@ejemplo.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    leftIcon="mail-outline"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    error={errors.email?.message}
                                />
                            )}
                        />
                    </View>
                </View>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <Button
                        title="Continuar"
                        onPress={handleSubmit(onSubmit)}
                        fullWidth
                        size="large"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
        marginBottom: 32,
    },
    form: {
        gap: 8,
    },
    pickerContainer: {
        marginBottom: 16,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
        marginBottom: 8,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: BrandColors.gray[300],
        borderRadius: 12,
        backgroundColor: BrandColors.white,
        overflow: 'hidden',
    },
    pickerWrapperError: {
        borderColor: BrandColors.error,
    },
    picker: {
        height: 50,
    },
    errorText: {
        fontSize: 12,
        color: BrandColors.error,
        marginTop: 4,
    },
    footer: {
        paddingTop: 16,
    },
});
