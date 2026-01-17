import { Button, Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useUpdateDriverProfile } from '@/hooks/useConductor';
import { useUpdatePassengerProfile } from '@/hooks/usePassenger';
import { useUpdateProfile, useUserProfile } from '@/hooks/useProfile';
import { checkUsernameAvailability, CheckUsernameResponse, updateUsername } from '@/services/usernameService';
import { useAuthStore } from '@/store/authStore';
import { UpdateProfileDto } from '@/types';
import { formatDateOfBirth, formatDateOfBirthLong } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EditProfile() {
    const router = useRouter();
    const storeUser = useAuthStore((state) => state.user);
    const { data: queryUser, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useUserProfile();
    const updateProfileMutation = useUpdateProfile();
    const updateDriverProfileMutation = useUpdateDriverProfile();
    const updatePassengerProfileMutation = useUpdatePassengerProfile();

    const user = queryUser || storeUser;

    // Form state
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>(
        user?.gender as any || ''
    );
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Driver specific state
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [vehicleType, setVehicleType] = useState('');

    // Username state
    const [username, setUsername] = useState(user?.username || '');
    const [usernameAvailability, setUsernameAvailability] = useState<CheckUsernameResponse | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    // Initialize state from user data
    React.useEffect(() => {
        if (queryUser) {
            setFirstName(queryUser.firstName || '');
            setLastName(queryUser.lastName || '');
            setBio(queryUser.bio || '');
            setDateOfBirth(queryUser.dateOfBirth || '');
            setGender(queryUser.gender as any || '');
            setUsername(queryUser.username || '');

            // Initialize driver data if applicable
            if (queryUser.role === 'DRIVER' && (queryUser as any).driver) {
                const driver = (queryUser as any).driver;
                setVehiclePlate(driver.vehiclePlate || '');
                setVehicleModel(driver.vehicleModel || '');
                setVehicleYear(driver.vehicleYear?.toString() || '');
                setVehicleColor(driver.vehicleColor || '');
                setVehicleType(driver.vehicleType || '');
            }
        } else if (storeUser) {
            setFirstName(storeUser.firstName || '');
            setLastName(storeUser.lastName || '');
        }
    }, [queryUser, storeUser]);

    const genderOptions = [
        { label: 'Masculino', value: 'male' },
        { label: 'Femenino', value: 'female' },
        { label: 'Otro', value: 'other' },
        { label: 'Prefiero no decir', value: 'prefer_not_to_say' },
    ];

    // Check username availability with debounce
    React.useEffect(() => {
        if (user?.username) return;

        if (!username || username.length < 3) {
            setUsernameAvailability(null);
            setUsernameError('');
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            setUsernameError('Solo letras y números (sin símbolos ni espacios)');
            setUsernameAvailability(null);
            return;
        }

        if (username.length > 20) {
            setUsernameError('Máximo 20 caracteres');
            setUsernameAvailability(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsCheckingUsername(true);
            setUsernameError('');
            try {
                const result = await checkUsernameAvailability(username);
                setUsernameAvailability(result);
                if (!result.available) {
                    setUsernameError('Este username ya está en uso');
                }
            } catch (error) {
                setUsernameError('Error al verificar disponibilidad');
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [username, user?.username]);

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'El nombre y apellido son obligatorios');
            return;
        }

        if (firstName.trim().length < 2) {
            Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
            return;
        }

        if (lastName.trim().length < 2) {
            Alert.alert('Error', 'El apellido debe tener al menos 2 caracteres');
            return;
        }

        if (bio && bio.length > 500) {
            Alert.alert('Error', 'La biografía no puede exceder 500 caracteres');
            return;
        }

        if (!user?.username && username.trim()) {
            if (username.trim().length < 3 || username.trim().length > 20) {
                Alert.alert('Error', 'El username debe tener entre 3 y 20 caracteres');
                return;
            }

            if (!/^[a-zA-Z0-9]+$/.test(username.trim())) {
                Alert.alert('Error', 'El username solo puede contener letras y números');
                return;
            }

            if (usernameError || !usernameAvailability?.available) {
                Alert.alert('Error', 'El username no está disponible o es inválido');
                return;
            }
        }

        // Prepare general profile update
        const updateData: UpdateProfileDto = {};
        if (firstName !== user?.firstName) updateData.firstName = firstName.trim();
        if (lastName !== user?.lastName) updateData.lastName = lastName.trim();
        if (bio !== user?.bio) updateData.bio = bio.trim() || undefined;
        if (dateOfBirth !== user?.dateOfBirth) updateData.dateOfBirth = dateOfBirth || undefined;
        if (gender !== user?.gender) updateData.gender = gender || undefined;

        // Prepare role-specific update
        let roleUpdateData: any = null;
        if (user?.role === 'DRIVER') {
            const driver = (user as any).driver || {};
            const newDriverData: any = {};
            if (vehiclePlate !== driver.vehiclePlate) newDriverData.vehiclePlate = vehiclePlate.trim();
            if (vehicleModel !== driver.vehicleModel) newDriverData.vehicleModel = vehicleModel.trim();
            if (vehicleYear !== driver.vehicleYear?.toString()) newDriverData.vehicleYear = parseInt(vehicleYear) || undefined;
            if (vehicleColor !== driver.vehicleColor) newDriverData.vehicleColor = vehicleColor.trim();
            if (vehicleType !== driver.vehicleType) newDriverData.vehicleType = vehicleType.trim();

            if (Object.keys(newDriverData).length > 0) {
                roleUpdateData = newDriverData;
            }
        }

        const hasProfileChanges = Object.keys(updateData).length > 0;
        const hasRoleChanges = !!roleUpdateData;
        const hasUsernameChange = !user?.username && username.trim();

        if (!hasProfileChanges && !hasUsernameChange && !hasRoleChanges) {
            Alert.alert('Sin cambios', 'No has realizado ningún cambio');
            return;
        }

        try {
            if (hasUsernameChange) {
                Alert.alert(
                    '⚠️ Username Permanente',
                    'El username NO se puede cambiar una vez establecido. ¿Estás seguro de usar "' + username.trim() + '"?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Confirmar',
                            style: 'default',
                            onPress: async () => {
                                try {
                                    await updateUsername(username.trim());
                                    if (hasProfileChanges) {
                                        await updateProfileMutation.mutateAsync(updateData);
                                    }
                                    if (hasRoleChanges) {
                                        if (user?.role === 'DRIVER') {
                                            await updateDriverProfileMutation.mutateAsync(roleUpdateData);
                                        }
                                    }
                                    Alert.alert(
                                        'Éxito',
                                        'Tu perfil ha sido actualizado correctamente',
                                        [{
                                            text: 'OK', onPress: () => {
                                                const profilePath = user?.role === 'DRIVER' ? '/conductor/profile' : '/passenger/profile';
                                                router.replace(profilePath as any);
                                            }
                                        }]
                                    );
                                } catch (error: any) {
                                    const errorMessage = error.response?.data?.message || 'Error al actualizar el perfil';
                                    Alert.alert('Error', errorMessage);
                                }
                            },
                        },
                    ]
                );
                return;
            }

            if (hasProfileChanges || hasRoleChanges) {
                if (hasProfileChanges) {
                    await updateProfileMutation.mutateAsync(updateData);
                }
                if (hasRoleChanges) {
                    if (user?.role === 'DRIVER') {
                        await updateDriverProfileMutation.mutateAsync(roleUpdateData);
                    }
                }
                Alert.alert(
                    'Éxito',
                    'Tu perfil ha sido actualizado correctamente',
                    [{
                        text: 'OK', onPress: () => {
                            const profilePath = user?.role === 'DRIVER' ? '/conductor/profile' : '/passenger/profile';
                            router.replace(profilePath as any);
                        }
                    }]
                );
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar el perfil';
            Alert.alert('Error', errorMessage);
        }
    };

    const handleCancel = () => {
        const hasChanges =
            firstName !== user?.firstName ||
            lastName !== user?.lastName ||
            bio !== user?.bio ||
            dateOfBirth !== user?.dateOfBirth ||
            gender !== user?.gender;

        if (hasChanges) {
            Alert.alert(
                'Descartar cambios',
                '¿Estás seguro que deseas descartar los cambios?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Descartar', onPress: () => router.back(), style: 'destructive' },
                ]
            );
        } else {
            const profilePath = user?.role === 'DRIVER' ? '/conductor/profile' : '/passenger/profile';
            router.replace(profilePath as any);
        }
    };

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDateOfBirth(formatDate(selectedDate));
        }
    };

    if (profileError && !user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={BrandColors.error} />
                    <Text style={styles.errorTitle}>No se pudo cargar el perfil</Text>
                    <Text style={styles.errorSubtitle}>
                        Hubo un problema al obtener tu información. Por favor, intenta de nuevo.
                    </Text>
                    <Button
                        title="Reintentar"
                        onPress={() => refetchProfile()}
                        style={styles.retryButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    if (isLoadingProfile && !user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <Animated.View
                    entering={FadeInDown.duration(400)}
                    style={styles.header}
                >
                    <LinearGradient
                        colors={[BrandColors.primary, BrandColors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Editar Perfil</Text>
                        <View style={styles.headerSpacer} />
                    </LinearGradient>
                </Animated.View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(500)}
                        style={styles.avatarSection}
                    >
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={['#ffffff', '#f0f0f0']}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {`${firstName[0] || 'U'}${lastName[0] || 'U'}`.toUpperCase()}
                                </Text>
                            </LinearGradient>
                            <TouchableOpacity style={styles.avatarEditButton}>
                                <Ionicons name="camera" size={20} color={BrandColors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        entering={FadeInUp.delay(300).duration(500)}
                        style={styles.section}
                    >
                        <Text style={styles.sectionTitle}>Información Personal</Text>
                        <Card variant="elevated" style={styles.formCard}>
                            {/* First Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color={BrandColors.gray[400]} />
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="Ingresa tu nombre"
                                        placeholderTextColor={BrandColors.gray[400]}
                                        maxLength={50}
                                    />
                                </View>
                            </View>

                            {/* Last Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Apellido *</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color={BrandColors.gray[400]} />
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Ingresa tu apellido"
                                        placeholderTextColor={BrandColors.gray[400]}
                                        maxLength={50}
                                    />
                                </View>
                            </View>

                            {/* Username */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    Username {user?.username ? '(Permanente)' : ''}
                                </Text>
                                <View style={[
                                    styles.inputContainer,
                                    usernameError && styles.inputContainerError,
                                    usernameAvailability?.available && !usernameError && styles.inputContainerSuccess,
                                ]}>
                                    <Ionicons name="at-outline" size={20} color={BrandColors.gray[400]} />
                                    <TextInput
                                        style={styles.input}
                                        value={username}
                                        onChangeText={setUsername}
                                        placeholder={user?.username ? user.username : "Elige tu username único"}
                                        placeholderTextColor={BrandColors.gray[400]}
                                        maxLength={20}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!user?.username}
                                    />
                                    {isCheckingUsername && (
                                        <ActivityIndicator size="small" color={BrandColors.primary} />
                                    )}
                                    {!isCheckingUsername && username.length >= 3 && !user?.username && (
                                        <>
                                            {usernameAvailability?.available && !usernameError && (
                                                <Ionicons name="checkmark-circle" size={20} color={BrandColors.success} />
                                            )}
                                            {(usernameError || !usernameAvailability?.available) && (
                                                <Ionicons name="close-circle" size={20} color={BrandColors.error} />
                                            )}
                                        </>
                                    )}
                                    {user?.username && (
                                        <Ionicons name="lock-closed" size={20} color={BrandColors.gray[400]} />
                                    )}
                                </View>
                                {!user?.username && (
                                    <Text style={styles.charCount}>{username.length}/20 caracteres</Text>
                                )}
                                {usernameError && !user?.username && (
                                    <Text style={styles.errorText}>{usernameError}</Text>
                                )}
                                {usernameAvailability?.available && !usernameError && username.length >= 3 && !user?.username && (
                                    <Text style={styles.successText}>✓ Username disponible</Text>
                                )}
                                {user?.username && (
                                    <Text style={styles.inputHint}>
                                        ⚠️ El username no se puede cambiar una vez establecido
                                    </Text>
                                )}
                                {!user?.username && !usernameError && username.length < 3 && (
                                    <Text style={styles.inputHint}>
                                        Mínimo 3 caracteres, solo letras y números
                                    </Text>
                                )}
                            </View>

                            {/* Bio */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Biografía</Text>
                                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="Cuéntanos sobre ti..."
                                        placeholderTextColor={BrandColors.gray[400]}
                                        multiline
                                        numberOfLines={4}
                                        maxLength={500}
                                        textAlignVertical="top"
                                    />
                                </View>
                                <Text style={styles.charCount}>{bio.length}/500</Text>
                            </View>

                            {/* Driver Specific Fields: Vehicle Info */}
                            {user?.role === 'DRIVER' && (
                                <View style={styles.roleSection}>
                                    <View style={styles.sectionDivider} />
                                    <Text style={styles.roleSectionTitle}>Información del Vehículo</Text>

                                    {/* Vehicle Plate */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Placa del Vehículo</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="card-outline" size={20} color={BrandColors.gray[400]} />
                                            <TextInput
                                                style={styles.input}
                                                value={vehiclePlate}
                                                onChangeText={setVehiclePlate}
                                                placeholder="Ej: ABC-123"
                                                placeholderTextColor={BrandColors.gray[400]}
                                                autoCapitalize="characters"
                                            />
                                        </View>
                                    </View>

                                    {/* Vehicle Model */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Modelo / Marca</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="car-outline" size={20} color={BrandColors.gray[400]} />
                                            <TextInput
                                                style={styles.input}
                                                value={vehicleModel}
                                                onChangeText={setVehicleModel}
                                                placeholder="Ej: Chevrolet Onix"
                                                placeholderTextColor={BrandColors.gray[400]}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.row}>
                                        {/* Vehicle Year */}
                                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                            <Text style={styles.inputLabel}>Año</Text>
                                            <View style={styles.inputContainer}>
                                                <TextInput
                                                    style={styles.input}
                                                    value={vehicleYear}
                                                    onChangeText={setVehicleYear}
                                                    placeholder="2023"
                                                    placeholderTextColor={BrandColors.gray[400]}
                                                    keyboardType="numeric"
                                                    maxLength={4}
                                                />
                                            </View>
                                        </View>

                                        {/* Vehicle Color */}
                                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                            <Text style={styles.inputLabel}>Color</Text>
                                            <View style={styles.inputContainer}>
                                                <TextInput
                                                    style={styles.input}
                                                    value={vehicleColor}
                                                    onChangeText={setVehicleColor}
                                                    placeholder="Blanco"
                                                    placeholderTextColor={BrandColors.gray[400]}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Vehicle Type */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Tipo de Vehículo</Text>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                value={vehicleType}
                                                onChangeText={setVehicleType}
                                                placeholder="Ej: Sedan, SUV, Moto"
                                                placeholderTextColor={BrandColors.gray[400]}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.sectionDivider} />
                                </View>
                            )}

                            {/* Date of Birth */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={styles.inputContainer}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={BrandColors.gray[400]} />
                                    <Text
                                        style={[
                                            styles.input,
                                            !dateOfBirth && styles.placeholderText,
                                        ]}
                                    >
                                        {dateOfBirth
                                            ? formatDateOfBirth(dateOfBirth)
                                            : 'Selecciona tu fecha de nacimiento'
                                        }
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={BrandColors.gray[400]} />
                                </TouchableOpacity>
                                {dateOfBirth && (
                                    <Text style={styles.inputHint}>
                                        {formatDateOfBirthLong(dateOfBirth)}
                                    </Text>
                                )}
                            </View>

                            {/* Date Picker Modal */}
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1900, 0, 1)}
                                    locale="es-ES"
                                />
                            )}

                            {/* Gender */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Género</Text>
                                <View style={styles.genderContainer}>
                                    {genderOptions.map((option) => (
                                        <AnimatedTouchable
                                            key={option.value}
                                            onPress={() => setGender(option.value as any)}
                                            style={[
                                                styles.genderOption,
                                                gender === option.value && styles.genderOptionActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.genderOptionText,
                                                    gender === option.value && styles.genderOptionTextActive,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </AnimatedTouchable>
                                    ))}
                                </View>
                            </View>
                        </Card>
                    </Animated.View>

                    {/* Action Buttons */}
                    <Animated.View
                        entering={FadeInUp.delay(400).duration(500)}
                        style={styles.actionsContainer}
                    >
                        <Button
                            title="Guardar Cambios"
                            onPress={handleSave}
                            loading={updateProfileMutation.isPending}
                            disabled={updateProfileMutation.isPending}
                            fullWidth
                        />
                        <Button
                            title="Cancelar"
                            onPress={handleCancel}
                            variant="outline"
                            disabled={updateProfileMutation.isPending}
                            fullWidth
                        />
                    </Animated.View>
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
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    header: {
        marginBottom: 16,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.white,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: BrandColors.white,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.primary,
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: BrandColors.white,
    },
    avatarHint: {
        fontSize: 13,
        color: BrandColors.gray[600],
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    formCard: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[700],
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[100],
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    textAreaContainer: {
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: BrandColors.gray[900],
        marginLeft: 12,
        padding: 0,
    },
    textArea: {
        marginLeft: 0,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputHint: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginTop: 4,
    },
    placeholderText: {
        color: BrandColors.gray[400],
    },
    charCount: {
        fontSize: 12,
        color: BrandColors.gray[500],
        textAlign: 'right',
        marginTop: 4,
    },
    genderContainer: {
        gap: 8,
    },
    genderOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[300],
        backgroundColor: BrandColors.white,
    },
    genderOptionActive: {
        borderColor: BrandColors.primary,
        backgroundColor: `${BrandColors.primary}15`,
    },
    genderOptionText: {
        fontSize: 15,
        color: BrandColors.gray[700],
        fontWeight: '500',
    },
    genderOptionTextActive: {
        color: BrandColors.primary,
        fontWeight: '600',
    },
    inputContainerError: {
        borderColor: BrandColors.error,
        backgroundColor: `${BrandColors.error}05`,
    },
    inputContainerSuccess: {
        borderColor: BrandColors.success,
        backgroundColor: `${BrandColors.success}05`,
    },
    errorText: {
        fontSize: 12,
        color: BrandColors.error,
        marginTop: 4,
        fontWeight: '500',
    },
    successText: {
        fontSize: 12,
        color: BrandColors.success,
        marginTop: 4,
        fontWeight: '500',
    },
    actionsContainer: {
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    retryButton: {
        minWidth: 200,
    },
    roleSection: {
        marginTop: 8,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: BrandColors.gray[200],
        marginVertical: 24,
    },
    roleSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: BrandColors.primary,
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
