import { Button } from '@/components/ui';
import { DEPARTMENTS, getCitiesByDepartment } from '@/constants/locations';
import { BrandColors } from '@/constants/theme';
import { useUpdateDriverProfile } from '@/hooks/useConductor';
import { useUpdatePassengerProfile } from '@/hooks/usePassenger';
import { useUpdateProfile, useUserProfile } from '@/hooks/useProfile';
import { checkUsernameAvailability, CheckUsernameResponse, updateUsername } from '@/services/usernameService';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getErrorMessage } from '@/utils/errorHandling';
import { formatDateOfBirth, formatDateOfBirthLong } from '@/utils/formatters';
import { vehiclePlateSchema } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { SelectionModal } from '@/components/ui/SelectionModal';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Vehicle Selection Constants
const VEHICLE_TYPES = [
    { label: 'Sedán', value: 'SEDAN' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Hatchback', value: 'HATCHBACK' },
    { label: 'Motocicleta', value: 'MOTORCYCLE' },
    { label: 'Van', value: 'VAN' },
    { label: 'Camión', value: 'TRUCK' },
    { label: 'Bicicleta', value: 'BICYCLE' },
];

const VEHICLE_COLORS = [
    { label: 'Blanco', value: 'Blanco' },
    { label: 'Negro', value: 'Negro' },
    { label: 'Gris', value: 'Gris' },
    { label: 'Plata', value: 'Plata' },
    { label: 'Rojo', value: 'Rojo' },
    { label: 'Azul', value: 'Azul' },
    { label: 'Verde', value: 'Verde' },
    { label: 'Amarillo', value: 'Amarillo' },
    { label: 'Naranja', value: 'Naranja' },
    { label: 'Otro', value: 'Otro' },
];

const VEHICLE_BRANDS = [
    { label: 'Chevrolet', value: 'Chevrolet' },
    { label: 'Renault', value: 'Renault' },
    { label: 'Toyota', value: 'Toyota' },
    { label: 'Kia', value: 'Kia' },
    { label: 'Hyundai', value: 'Hyundai' },
    { label: 'Mazda', value: 'Mazda' },
    { label: 'Nissan', value: 'Nissan' },
    { label: 'Ford', value: 'Ford' },
    { label: 'Suzuki', value: 'Suzuki' },
    { label: 'Volkswagen', value: 'Volkswagen' },
    { label: 'Otro', value: 'Otro' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EditProfile() {
    const router = useRouter();
    const storeUser = useAuthStore((state) => state.user);
    const { data: queryUser, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useUserProfile();
    const updateProfileMutation = useUpdateProfile();
    const updateDriverProfileMutation = useUpdateDriverProfile();
    const updatePassengerProfileMutation = useUpdatePassengerProfile();

    const { biometricsEnabled, setBiometricsEnabled } = useSettingsStore();

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
    const [country, setCountry] = useState(user?.country || 'Colombia');
    const [department, setDepartment] = useState(user?.department || '');
    const [city, setCity] = useState(user?.city || '');
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);

    // Driver specific state
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [vehicleType, setVehicleType] = useState('');

    // Passenger specific state
    const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('');
    const [autoRecharge, setAutoRecharge] = useState(false);
    const [autoRechargeThreshold, setAutoRechargeThreshold] = useState('');
    const [autoRechargeAmount, setAutoRechargeAmount] = useState('');

    // Username state
    const [username, setUsername] = useState(user?.username || '');
    const [usernameAvailability, setUsernameAvailability] = useState<CheckUsernameResponse | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [isVehicleSet, setIsVehicleSet] = useState(false);

    // Initialize state from user data
    React.useEffect(() => {
        if (queryUser) {
            setFirstName(queryUser.firstName || '');
            setLastName(queryUser.lastName || '');
            setBio(queryUser.bio || '');
            setDateOfBirth(queryUser.dateOfBirth || '');
            setGender(queryUser.gender as any || '');
            setUsername(queryUser.username || '');
            setCountry(queryUser.country || 'Colombia');
            setDepartment(queryUser.department || '');
            setCity(queryUser.city || '');

            // Initialize driver data if applicable
            if (queryUser.role === 'DRIVER' && (queryUser as any).driver) {
                const driver = (queryUser as any).driver;
                setVehiclePlate(driver.vehiclePlate || '');
                setVehicleModel(driver.vehicleModel || '');
                setVehicleYear(driver.vehicleYear?.toString() || '');
                setVehicleColor(driver.vehicleColor || '');
                setVehicleType(driver.vehicleType || '');
            }

            // Initialize passenger data if applicable
            if (queryUser.role === 'PASSENGER' && (queryUser as any).passenger) {
                const passenger = (queryUser as any).passenger;
                setPreferredPaymentMethod(passenger.preferredPaymentMethod || '');
                setAutoRecharge(passenger.autoRecharge || false);
                setAutoRechargeThreshold(passenger.autoRechargeThreshold?.toString() || '');
                setAutoRechargeAmount(passenger.autoRechargeAmount?.toString() || '');
            }
        } else if (storeUser) {
            setFirstName(storeUser.firstName || '');
            setLastName(storeUser.lastName || '');
        }

        // Determine if vehicle data is already set to lock it
        if (user?.role === 'DRIVER') {
            const driver = user.driver;
            if (driver && driver.vehiclePlate && driver.vehicleModel) {
                setIsVehicleSet(true);
            }
        }
    }, [queryUser, storeUser, user?.role, user?.driver]);

    // Select Modals state
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);

    const departmentOptions = useMemo(() => {
        return DEPARTMENTS.map(dep => ({ label: dep, value: dep }));
    }, []);

    const cityOptions = useMemo(() => {
        if (!department) return [];
        return getCitiesByDepartment(department).map(c => ({ label: c, value: c }));
    }, [department]);

    // Update city when department changes
    React.useEffect(() => {
        if (department && user?.department !== department) {
            // Only reset city if the department has actually changed from what we selected
            // and it's not the initial load
            const cities = getCitiesByDepartment(department);
            if (city && !cities.includes(city)) {
                setCity('');
            }
        }
    }, [department]);

    // Generate Years Options
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear + 1; y >= 1990; y--) {
            years.push({ label: y.toString(), value: y.toString() });
        }
        return years;
    }, []);

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
                console.error('Error checking username availability:', error);
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

        if (!department) {
            Alert.alert('Error', 'El departamento es obligatorio');
            return;
        }

        if (!city) {
            Alert.alert('Error', 'La ciudad es obligatoria');
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

        // Driver validation
        if (user?.role === 'DRIVER') {
            const plate = vehiclePlate?.toString().trim() || '';
            const model = vehicleModel?.toString().trim() || '';
            const year = vehicleYear?.toString().trim() || '';
            const color = vehicleColor?.toString().trim() || '';
            const type = vehicleType?.toString().trim() || '';

            if (!plate || !model || !year || !color || !type) {
                Alert.alert(
                    'Información Incompleta',
                    'Como conductor, debes completar todos los datos de tu vehículo para poder recibir pagos.'
                );
                return;
            }

            const plateValidation = vehiclePlateSchema.safeParse(plate);
            if (!plateValidation.success) {
                Alert.alert('Placa Inválida', plateValidation.error.issues[0].message);
                return;
            }

            const yearNum = parseInt(year);
            const currentYear = new Date().getFullYear();
            if (isNaN(yearNum) || yearNum < 1990 || yearNum > currentYear + 1) {
                Alert.alert('Año Inválido', `El año del vehículo debe estar entre 1990 y ${currentYear + 1}`);
                return;
            }
        }


        // Prepare update data
        const updateData: any = {};
        if (firstName !== user?.firstName) updateData.firstName = firstName.trim();
        if (lastName !== user?.lastName) updateData.lastName = lastName.trim();
        if (bio !== user?.bio) updateData.bio = bio.trim() || '';
        if (dateOfBirth !== user?.dateOfBirth) updateData.dateOfBirth = dateOfBirth || undefined;
        if (gender !== user?.gender) updateData.gender = gender || undefined;
        if (country !== user?.country) updateData.country = country;
        if (department !== user?.department) updateData.department = department;
        if (city !== user?.city) updateData.city = city;

        // Add driver specific data if applicable
        if (user?.role === 'DRIVER') {
            const driver = (user as any).driver || {};
            const plate = vehiclePlate?.toString().trim() || '';
            const model = vehicleModel?.toString().trim() || '';
            const year = vehicleYear?.toString().trim() || '';
            const color = vehicleColor?.toString().trim() || '';
            const type = vehicleType?.toString().trim() || '';

            if (plate !== driver.vehiclePlate) updateData.vehiclePlate = plate;
            if (model !== driver.vehicleModel) updateData.vehicleModel = model;
            if (year !== driver.vehicleYear?.toString()) updateData.vehicleYear = parseInt(year) || undefined;
            if (color !== driver.vehicleColor) updateData.vehicleColor = color;
            if (type !== driver.vehicleType) updateData.vehicleType = type;
        }

        // Add passenger specific data if applicable
        if (user?.role === 'PASSENGER') {
            const passenger = (user as any).passenger || {};
            if (preferredPaymentMethod !== passenger.preferredPaymentMethod) updateData.preferredPaymentMethod = preferredPaymentMethod;
            if (autoRecharge !== passenger.autoRecharge) updateData.autoRecharge = autoRecharge;
            if (autoRechargeThreshold !== passenger.autoRechargeThreshold?.toString()) updateData.autoRechargeThreshold = parseFloat(autoRechargeThreshold) || undefined;
            if (autoRechargeAmount !== passenger.autoRechargeAmount?.toString()) updateData.autoRechargeAmount = parseFloat(autoRechargeAmount) || undefined;
        }

        const hasChanges = Object.keys(updateData).length > 0;
        const hasUsernameChange = !user?.username && username.trim();

        if (!hasChanges && !hasUsernameChange) {
            Alert.alert('Sin cambios', 'No has realizado ningún cambio');
            return;
        }

        const performUpdate = async () => {
            try {
                if (hasUsernameChange) {
                    await updateUsername(username.trim());
                }

                if (hasChanges) {
                    if (user?.role === 'DRIVER') {
                        await updateDriverProfileMutation.mutateAsync(updateData);
                    } else if (user?.role === 'PASSENGER') {
                        await updatePassengerProfileMutation.mutateAsync(updateData);
                    } else {
                        await updateProfileMutation.mutateAsync(updateData);
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
                Alert.alert('Error', getErrorMessage(error, 'Error al actualizar el perfil'));
            }
        };

        if (hasUsernameChange) {
            Alert.alert(
                '⚠️ Username Permanente',
                'El username NO se puede cambiar una vez establecido. ¿Estás seguro de usar "' + username.trim() + '"?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', style: 'default', onPress: performUpdate },
                ]
            );
        } else {
            performUpdate();
        }
    };

    const handleCancel = () => {
        const passenger = (user as any).passenger || {};
        const hasChanges =
            firstName !== user?.firstName ||
            lastName !== user?.lastName ||
            bio !== (user?.bio || '') ||
            dateOfBirth !== user?.dateOfBirth ||
            gender !== user?.gender ||
            (!user?.username && username.trim() !== '') ||
            department !== (user?.department || '') ||
            city !== (user?.city || '') ||
            autoRecharge !== passenger.autoRecharge ||
            autoRechargeThreshold !== (passenger.autoRechargeThreshold?.toString() || '') ||
            autoRechargeAmount !== (passenger.autoRechargeAmount?.toString() || '');

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
                        {/* Account Info (Read-only) */}
                        <View style={styles.roleSection}>
                            <Text style={styles.roleSectionTitle}>Información de Cuenta</Text>

                            {/* Document ID */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Documento de Identidad</Text>
                                <View style={[styles.inputContainer, styles.readOnlyInput]}>
                                    <Ionicons name="id-card-outline" size={20} color={BrandColors.gray[400]} />
                                    <Text style={styles.readOnlyText}>
                                        {user?.typeDni} - {user?.numberDni}
                                    </Text>
                                    <View style={{ flex: 1 }} />
                                    <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} />
                                </View>
                            </View>

                            {/* Phone Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Teléfono</Text>
                                <View style={[styles.inputContainer, styles.readOnlyInput]}>
                                    <Ionicons name="call-outline" size={20} color={BrandColors.gray[400]} />
                                    <Text style={styles.readOnlyText}>{user?.phoneNumber}</Text>
                                    <View style={{ flex: 1 }} />
                                    {user?.phoneVerified && (
                                        <Ionicons name="checkmark-circle" size={16} color={BrandColors.success} />
                                    )}
                                    <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} style={{ marginLeft: 4 }} />
                                </View>
                            </View>

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                                <View style={[styles.inputContainer, styles.readOnlyInput]}>
                                    <Ionicons name="mail-outline" size={20} color={BrandColors.gray[400]} />
                                    <Text style={styles.readOnlyText}>{user?.email}</Text>
                                    <View style={{ flex: 1 }} />
                                    {user?.emailVerified && (
                                        <Ionicons name="checkmark-circle" size={16} color={BrandColors.success} />
                                    )}
                                    <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} style={{ marginLeft: 4 }} />
                                </View>
                            </View>

                            <View style={styles.sectionDivider} />
                        </View>
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
                                <Text style={styles.inputHint}>* Campos obligatorios para recibir pagos</Text>

                                {/* Vehicle Plate */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Placa del Vehículo *</Text>
                                    <View style={[styles.inputContainer, isVehicleSet && styles.readOnlyInput]}>
                                        <Ionicons name="card-outline" size={20} color={BrandColors.gray[400]} />
                                        <TextInput
                                            style={styles.input}
                                            value={vehiclePlate}
                                            onChangeText={setVehiclePlate}
                                            placeholder="Ej: ABC-123"
                                            placeholderTextColor={BrandColors.gray[400]}
                                            autoCapitalize="characters"
                                            editable={!isVehicleSet}
                                        />
                                        {isVehicleSet && <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} />}
                                    </View>
                                </View>

                                {/* Vehicle Model */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Modelo / Marca *</Text>
                                    <TouchableOpacity
                                        style={[styles.inputContainer, isVehicleSet && styles.readOnlyInput]}
                                        onPress={() => !isVehicleSet && setShowBrandModal(true)}
                                        activeOpacity={isVehicleSet ? 1 : 0.7}
                                    >
                                        <Ionicons name="car-outline" size={20} color={BrandColors.gray[400]} />
                                        <Text style={[styles.input, !vehicleModel && styles.placeholderText]}>
                                            {vehicleModel || 'Seleccionar marca'}
                                        </Text>
                                        {!isVehicleSet ? (
                                            <Ionicons name="chevron-down" size={20} color={BrandColors.gray[400]} />
                                        ) : (
                                            <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.row}>
                                    {/* Vehicle Year */}
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.inputLabel}>Año *</Text>
                                        <TouchableOpacity
                                            style={[styles.inputContainer, isVehicleSet && styles.readOnlyInput]}
                                            onPress={() => !isVehicleSet && setShowYearModal(true)}
                                            activeOpacity={isVehicleSet ? 1 : 0.7}
                                        >
                                            <Text style={[styles.input, !vehicleYear && styles.placeholderText]}>
                                                {vehicleYear || 'Año'}
                                            </Text>
                                            {!isVehicleSet ? (
                                                <Ionicons name="chevron-down" size={16} color={BrandColors.gray[400]} />
                                            ) : (
                                                <Ionicons name="lock-closed" size={14} color={BrandColors.gray[400]} />
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {/* Vehicle Color */}
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.inputLabel}>Color *</Text>
                                        <TouchableOpacity
                                            style={[styles.inputContainer, isVehicleSet && styles.readOnlyInput]}
                                            onPress={() => !isVehicleSet && setShowColorModal(true)}
                                            activeOpacity={isVehicleSet ? 1 : 0.7}
                                        >
                                            <Text style={[styles.input, !vehicleColor && styles.placeholderText]}>
                                                {vehicleColor || 'Color'}
                                            </Text>
                                            {!isVehicleSet ? (
                                                <Ionicons name="chevron-down" size={16} color={BrandColors.gray[400]} />
                                            ) : (
                                                <Ionicons name="lock-closed" size={14} color={BrandColors.gray[400]} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Vehicle Type */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Tipo de Vehículo *</Text>
                                    <TouchableOpacity
                                        style={[styles.inputContainer, isVehicleSet && styles.readOnlyInput]}
                                        onPress={() => !isVehicleSet && setShowTypeModal(true)}
                                        activeOpacity={isVehicleSet ? 1 : 0.7}
                                    >
                                        <Text style={[styles.input, !vehicleType && styles.placeholderText]}>
                                            {vehicleType ? VEHICLE_TYPES.find(t => t.value === (vehicleType as string).toUpperCase())?.label || vehicleType : 'Seleccionar tipo'}
                                        </Text>
                                        {!isVehicleSet ? (
                                            <Ionicons name="chevron-down" size={20} color={BrandColors.gray[400]} />
                                        ) : (
                                            <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.sectionDivider} />
                            </View>
                        )}

                        {/* Passenger Specific Fields: Recharge Preferences */}
                        {user?.role === 'PASSENGER' && (
                            <View style={styles.roleSection}>
                                <View style={styles.sectionDivider} />
                                <View style={styles.rowBetween}>
                                    <Text style={styles.roleSectionTitle}>Configuración de Recarga</Text>
                                    <Switch
                                        value={autoRecharge}
                                        onValueChange={setAutoRecharge}
                                        trackColor={{ false: BrandColors.gray[300], true: BrandColors.primary }}
                                        thumbColor={Platform.OS === 'ios' ? undefined : BrandColors.white}
                                    />
                                </View>
                                <Text style={styles.inputHint}>
                                    Recarga automáticamente tu cuenta cuando el saldo sea bajo.
                                </Text>

                                {autoRecharge && (
                                    <Animated.View entering={FadeInDown.duration(300)}>
                                        <View style={styles.row}>
                                            {/* Threshold */}
                                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                                <Text style={styles.inputLabel}>Mínimo Saldo (COP)</Text>
                                                <View style={styles.inputContainer}>
                                                    <TextInput
                                                        style={styles.input}
                                                        value={autoRechargeThreshold}
                                                        onChangeText={setAutoRechargeThreshold}
                                                        placeholder="5000"
                                                        placeholderTextColor={BrandColors.gray[400]}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>

                                            {/* Amount */}
                                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                                <Text style={styles.inputLabel}>Monto a Recargar (COP)</Text>
                                                <View style={styles.inputContainer}>
                                                    <TextInput
                                                        style={styles.input}
                                                        value={autoRechargeAmount}
                                                        onChangeText={setAutoRechargeAmount}
                                                        placeholder="20000"
                                                        placeholderTextColor={BrandColors.gray[400]}
                                                        keyboardType="numeric"
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </Animated.View>
                                )}
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
                                value={(() => { const d = dateOfBirth ? new Date(dateOfBirth) : new Date(); return isNaN(d.getTime()) ? new Date() : d; })()}
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

                        <View style={styles.sectionDivider} />

                        {/* Location Section */}
                        <Text style={styles.sectionTitle}>Ubicación</Text>

                        {/* Country (Read-only for now) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>País</Text>
                            <View style={[styles.inputContainer, styles.readOnlyInput]}>
                                <Ionicons name="globe-outline" size={20} color={BrandColors.gray[400]} />
                                <Text style={styles.readOnlyText}>Colombia</Text>
                                <View style={{ flex: 1 }} />
                                <Ionicons name="lock-closed" size={16} color={BrandColors.gray[400]} />
                            </View>
                        </View>

                        {/* Department Selector */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Departamento *</Text>
                            <TouchableOpacity
                                onPress={() => setShowDepartmentModal(true)}
                                style={styles.inputContainer}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="map-outline" size={20} color={BrandColors.gray[400]} />
                                <Text
                                    style={[
                                        styles.input,
                                        !department && styles.placeholderText,
                                    ]}
                                >
                                    {department || 'Selecciona departamento'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={BrandColors.gray[400]} />
                            </TouchableOpacity>
                        </View>

                        {/* City Selector */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ciudad *</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!department) {
                                        Alert.alert('Atención', 'Primero selecciona un departamento');
                                        return;
                                    }
                                    setShowCityModal(true);
                                }}
                                style={[styles.inputContainer, !department && styles.readOnlyInput]}
                                activeOpacity={department ? 0.7 : 1}
                            >
                                <Ionicons name="business-outline" size={20} color={BrandColors.gray[400]} />
                                <Text
                                    style={[
                                        styles.input,
                                        !city && styles.placeholderText,
                                    ]}
                                >
                                    {city || 'Selecciona ciudad'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={BrandColors.gray[400]} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionDivider} />
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
                    {/* Vehicle Select Modals */}
                    <SelectionModal
                        visible={showTypeModal}
                        onClose={() => setShowTypeModal(false)}
                        onSelect={setVehicleType}
                        options={VEHICLE_TYPES}
                        title="Tipo de Vehículo"
                        selectedValue={vehicleType}
                    />
                    <SelectionModal
                        visible={showBrandModal}
                        onClose={() => setShowBrandModal(false)}
                        onSelect={setVehicleModel}
                        options={VEHICLE_BRANDS}
                        title="Marca de Vehículo"
                        selectedValue={vehicleModel}
                    />
                    <SelectionModal
                        visible={showYearModal}
                        onClose={() => setShowYearModal(false)}
                        onSelect={setVehicleYear}
                        options={yearOptions}
                        title="Año del Vehículo"
                        selectedValue={vehicleYear}
                    />
                    <SelectionModal
                        visible={showColorModal}
                        onClose={() => setShowColorModal(false)}
                        onSelect={setVehicleColor}
                        options={VEHICLE_COLORS}
                        title="Color del Vehículo"
                        selectedValue={vehicleColor}
                    />

                    {/* Location Modals */}
                    <SelectionModal
                        visible={showDepartmentModal}
                        onClose={() => setShowDepartmentModal(false)}
                        onSelect={setDepartment}
                        options={departmentOptions}
                        title="Seleccionar Departamento"
                        selectedValue={department}
                    />
                    <SelectionModal
                        visible={showCityModal}
                        onClose={() => setShowCityModal(false)}
                        onSelect={setCity}
                        options={cityOptions}
                        title="Seleccionar Ciudad"
                        selectedValue={city}
                    />
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
    securitySection: {
        marginTop: 8,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[100],
    },
    securityItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    securityTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    securityItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    securityItemSubtitle: {
        fontSize: 13,
        color: BrandColors.gray[500],
        marginTop: 2,
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
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    readOnlyInput: {
        backgroundColor: BrandColors.gray[50],
        borderColor: BrandColors.gray[100],
    },
    readOnlyText: {
        fontSize: 16,
        color: BrandColors.gray[600],
        marginLeft: 12,
    },
});
