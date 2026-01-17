import { Platform } from "react-native";
const STAGE = process.env.EXPO_PUBLIC_STAGE || "dev";

const API_URL =
    (STAGE === "prod")
        ? process.env.EXPO_PUBLIC_API_BASE_URL
        : (Platform.OS === "ios")
            ? process.env.EXPO_PUBLIC_API_BASE_URL_IOS
            : process.env.EXPO_PUBLIC_API_BASE_URL_ANDROID;


export const config = {
    apiBaseUrl: API_URL || 'http://localhost:3000/api',
    inactivityTimeout: parseInt(process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT || '900000', 10), // 15 minutos por defecto
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutos antes de expiración
    pinLength: 6,
    onboardingSlides: 4,
};

export const storageKeys = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    firstTimeLaunch: 'first_time_launch',
    userProfile: 'user_profile',
    sessionId: 'session_id',
};
