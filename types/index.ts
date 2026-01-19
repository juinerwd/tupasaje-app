// User roles
export enum UserRole {
    PASSENGER = 'PASSENGER',
    DRIVER = 'DRIVER',
    ADMIN = 'ADMIN',
}

// User interface - matches /auth/me endpoint response
export interface User {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    typeDni: string;
    numberDni: string;
    phoneNumber: string;
    email: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    phoneVerifiedAt?: string | null;
    emailVerifiedAt?: string | null;
    username?: string;
    qrCode?: string;
    role: UserRole;
    avatar?: string | null;
    bio?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    profileCompleted: boolean;
    profileCompleteness: number;
    isActive: boolean;
    isVerified: boolean;
    isSuspended?: boolean;
    suspendedAt?: string | null;
    suspendedReason?: string | null;
    lastLoginAt?: string;
    lastActivityAt?: string;
    loginCount?: number;
    createdAt: string;
    updatedAt: string;
}

// Update Profile DTO
export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    username?: string;
}

// Authentication tokens
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    sessionId?: string;
}

// Login credentials
export interface LoginCredentials {
    phoneNumber: string;
    pin: string;
}

// Login response from backend
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: User;
}

// Registration data - matches backend exactly
export interface RegistrationData {
    firstName: string;
    lastName: string;
    typeDni: string;
    numberDni: string;
    email: string;
    phoneNumber: string;
    pin: string;
    confirmPin: string;
    role: UserRole;
    acceptTerms: boolean;
}

// Personal data for registration step 3
export interface PersonalData {
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    email: string;
}

// Favorite Location
export interface FavoriteLocation {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    createdAt: string;
}

// Passenger Profile
export interface PassengerProfile {
    id: number;
    userId: number;
    user: {
        id: number;
        documentId: string;
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        avatar?: string;
    };
    // Payment preferences
    preferredPaymentMethod?: string;
    autoRecharge: boolean;
    autoRechargeThreshold?: number;
    autoRechargeAmount?: number;
    // Trip preferences
    favoriteLocations?: FavoriteLocation[];
    savedAddresses?: any[];
    // Statistics
    totalTrips: number;
    totalSpent: number;
    averageRating: number;
    totalRatings: number;
    // Emergency
    emergencyUsedAt?: string;
    emergencyCounter: number;
    hasActiveEmergencyCode?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Update Passenger Profile DTO
export interface UpdatePassengerProfileDto {
    preferredPaymentMethod?: string;
    autoRecharge?: boolean;
    autoRechargeThreshold?: number;
    autoRechargeAmount?: number;
    savedAddresses?: any[];
}

// Driver Profile
export interface DriverProfile {
    id: number;
    userId: number;
    user: {
        id: number;
        documentId: string;
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        avatar?: string;
        bio?: string | null;
        dateOfBirth?: string | null;
        gender?: string | null;
        username?: string;
    };
    isAvailable: boolean;
    lastAvailableAt?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    vehicleColor?: string;
    vehicleType?: string;
    currentRoute?: string;
    totalTrips: number;
    totalWithdrawals: number;
    lastWithdrawalAt?: string;
    averageRating: number;
    totalRatings: number;
    createdAt: string;
    updatedAt: string;
}

// Update Driver Profile DTO
export interface UpdateDriverProfileDto {
    firstName?: string;
    lastName?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    username?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    vehicleColor?: string;
    vehicleType?: string;
}

// Driver Statistics
export interface DriverStatistics {
    totalEarnings: number;
    availableBalance: number;
    totalWithdrawals: number;
    lastWithdrawalAt?: string;
    totalTrips: number;
    averageRating: number;
}

// Wallet
export interface Wallet {
    id: number;
    userId: number;
    balance: string;
    heldBalance: string;
    currency: string;
    totalRecharged: string;
    totalSpent: string;
    totalReceived: string;
    isActive: boolean;
    isFrozen: boolean;
    frozenAt?: string;
    frozenReason?: string;
    createdAt: string;
    updatedAt: string;
}

// Wallet Balance (simplified)
export interface WalletBalance {
    balance: string;
    currency: string;
    totalRecharged: string;
    totalSpent: string;
    totalReceived: string;
    isActive: boolean;
    isFrozen: boolean;
}

// Transaction types
export enum TransactionType {
    RECHARGE = 'RECHARGE',
    TRANSFER = 'TRANSFER',
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
    REVERSAL = 'REVERSAL',
    WITHDRAWAL = 'WITHDRAWAL',
}

// Transaction status
export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

// Transaction interface
export interface Transaction {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    netAmount: string;
    currency: string;
    reference?: string;
    fromUserId?: number;
    toUserId?: number;
    fromUser?: {
        id: number;
        firstName: string;
        lastName: string;
        username?: string;
        email: string;
    };
    toUser?: {
        id: number;
        firstName: string;
        lastName: string;
        username?: string;
        email: string;
    };
    description?: string;
    wompiTransactionId?: string;
    wompiReference?: string;
    completedAt?: string;
    failedAt?: string;
    cancelledAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Transaction filters
export interface TransactionFilters {
    type?: TransactionType;
    status?: TransactionStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

// Driver Rides Response
export interface DriverRidesResponse {
    rides: Transaction[];
    total: number;
    limit: number;
    offset: number;
}

// Recharge DTO
export interface RechargeDto {
    amount: number;
    paymentMethodType: string; // 'CARD', 'NEQUI', 'PSE'
    redirectUrl?: string;
}

// Transfer DTO
export interface TransferDto {
    toUserId: number;
    amount: number;
    description?: string;
}

// Transfer Response
export interface TransferResponse {
    transactionId: string;
    reference: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: TransactionStatus;
    fromUser: {
        id: number;
        name: string;
    };
    toUser: {
        id: number;
        name: string;
    };
}

// Notification types
export enum NotificationType {
    AUTH = 'AUTH',
    PAYMENT = 'PAYMENT',
    RECHARGE = 'RECHARGE',
    SUPPORT = 'SUPPORT',
    SECURITY = 'SECURITY',
    SYSTEM = 'SYSTEM',
    EMERGENCY = 'EMERGENCY',
}

// Notification channels
export enum NotificationChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP',
}

// Notification status
export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    READ = 'READ',
}

// Notification
export interface Notification {
    id: string;
    userId: number;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    title: string;
    message: string;
    data?: any;
    sentAt?: string;
    readAt?: string;
    failedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Notifications Response
export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    limit: number;
    offset: number;
}

// Notification Preferences
export interface NotificationPreferences {
    id: number;
    userId: number;
    // By channel
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    // By type
    authNotifications: boolean;
    paymentNotifications: boolean;
    rechargeNotifications: boolean;
    supportNotifications: boolean;
    securityNotifications: boolean;
    systemNotifications: boolean;
    createdAt: string;
    updatedAt: string;
}

// Update Notification Preferences DTO
export interface UpdateNotificationPreferencesDto {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    authNotifications?: boolean;
    paymentNotifications?: boolean;
    rechargeNotifications?: boolean;
    supportNotifications?: boolean;
    securityNotifications?: boolean;
    systemNotifications?: boolean;
}

// Emergency Code
export interface EmergencyCode {
    code: string;
    expiresAt: string;
}

// Profile Completeness
export interface ProfileCompleteness {
    completeness: number;
    completed: boolean;
    missing: string[];
}

// Balance (legacy - keeping for backward compatibility)
export interface Balance {
    amount: number;
    currency: string;
    lastUpdated: string;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Verification code response
export interface VerificationCodeResponse {
    success: boolean;
    message: string;
}

// ID Types
export const ID_TYPES = [
    { label: 'Cédula de Ciudadanía', value: 'CC' },
    { label: 'Cédula de Extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PA' },
    { label: 'Tarjeta de Identidad', value: 'TI' },
] as const;

export type IdType = typeof ID_TYPES[number]['value'];

// ============================================================================
// QR CODE TYPES
// ============================================================================

// QR Code Types
export enum QRType {
    IDENTIFICATION = 'IDENTIFICATION',
    PAYMENT = 'PAYMENT',
}

// QR Code Status
export enum QRStatus {
    ACTIVE = 'ACTIVE',
    USED = 'USED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

// Payment QR Data
export interface PaymentQRData {
    id: string;
    token: string;
    type: QRType;
    amount: number;
    walletId: string;
    expiresAt: string;
    status: QRStatus;
    qrCode: string; // Base64 image
    payload: string; // JSON payload
    createdAt: string;
}

// Generate Payment QR DTO
export interface GeneratePaymentQRDto {
    amount: number;
    walletId: string;
    expiresInMinutes?: number;
}

// Validate QR DTO
export interface ValidateQRDto {
    token: string;
}

// Validate QR Response
export interface ValidateQRResponse {
    success: boolean;
    message: string;
    transaction?: {
        id: string;
        amount: number;
        from: string;
        to: string;
        createdAt: string;
    };
}

// QR Code Response (for identification QR)
export interface QRCodeResponse {
    qrCode: string;
    payload: string;
    username: string;
    format: string;
}

// ============================================
// RECHARGE & PAYMENT TYPES
// ============================================

// Payment method types supported by Wompi
export enum PaymentMethodType {
    CARD = 'CARD',
    PSE = 'PSE',
    NEQUI = 'NEQUI',
    BANCOLOMBIA = 'BANCOLOMBIA',
}

// Request to initiate a recharge
export interface RechargeRequest {
    amount: number;
    paymentMethodType: PaymentMethodType;
    redirectUrl?: string;
}

// Response from recharge initiation
export interface RechargeResponse {
    transactionId: number;
    wompiTransactionId: string;
    amount: number;
    status: string;
    paymentUrl: string | null;
}

export interface RechargeTransaction {
    id: number;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    fee: string;
    netAmount: string;
    currency: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    metadata?: {
        paymentMethodType?: string;
        reference?: string;
        wompiTransactionId?: string;
    };
}

// ============================================
// PAYMENT METHOD TYPES
// ============================================

export interface PaymentMethod {
    id: string;
    userId: number;
    type: PaymentMethodType;
    wompiTokenId?: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardHolder?: string;
    bankCode?: string;
    bankName?: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePaymentMethodDto {
    type: PaymentMethodType;
    wompiTokenId?: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardHolder?: string;
    bankCode?: string;
    bankName?: string;
    isDefault?: boolean;
}

export interface UpdatePaymentMethodDto {
    isDefault?: boolean;
    isActive?: boolean;
}

export interface UpdatePaymentMethodDto {
    isDefault?: boolean;
    isActive?: boolean;
}


// ============================================
// SECURITY & SESSION TYPES
// ============================================

export interface AuthSession {
    id: string;
    deviceName?: string;
    deviceType?: string;
    platform?: string;
    browser?: string;
    ipAddress: string;
    ipCity?: string;
    ipCountry?: string;
    lastActivityAt: string;
    createdAt: string;
    isTrustedDevice: boolean;
}

export interface ChangePinDto {
    currentPin: string;
    newPin: string;
    confirmNewPin: string;
}

export interface ForgotPinDto {
    phoneNumber: string;
    email?: string;
    deliveryMethod?: 'sms' | 'email' | 'both';
}

export interface ResetPinDto {
    token: string;
    newPin: string;
    confirmNewPin: string;
    otpCode?: string;
}

// ============================================
// PROMOTION TYPES
// ============================================

export interface Promotion {
    id: string;
    title: string;
    description: string;
    icon: string;
    backgroundColor: string;
    actionLabel: string;
    actionType: 'RECHARGE' | 'REFERRAL' | 'EXTERNAL' | 'INTERNAL';
    actionValue?: string;
    expiresAt?: string;
}

// ============================================
// WITHDRAWAL METHOD TYPES
// ============================================

export enum WithdrawalMethodType {
    BANK_ACCOUNT = 'BANK_ACCOUNT',
    NEQUI = 'NEQUI',
    DAVIPLATA = 'DAVIPLATA',
}

export interface WithdrawalMethod {
    id: string;
    userId: number;
    type: WithdrawalMethodType;
    bankName?: string;
    accountNumber: string;
    accountType?: string;
    holderName: string;
    holderDni: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWithdrawalMethodDto {
    type: WithdrawalMethodType;
    bankName?: string;
    accountNumber: string;
    accountType?: string;
    holderName: string;
    holderDni: string;
    isDefault?: boolean;
}

export interface UpdateWithdrawalMethodDto {
    isDefault?: boolean;
    isActive?: boolean;
}

