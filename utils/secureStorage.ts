import { storageKeys } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';

/**
 * Save authentication tokens securely
 */
export async function saveTokens(accessToken: string, refreshToken: string, sessionId?: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(storageKeys.accessToken, accessToken);
        await SecureStore.setItemAsync(storageKeys.refreshToken, refreshToken);
        if (sessionId) {
            await SecureStore.setItemAsync(storageKeys.sessionId, sessionId);
        }
    } catch (error) {
        console.error('Error saving tokens:', error);
        throw new Error('Failed to save authentication tokens');
    }
}

/**
 * Get access token from secure storage
 */
export async function getAccessToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(storageKeys.accessToken);
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

/**
 * Get refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(storageKeys.refreshToken);
    } catch (error) {
        console.error('Error getting refresh token:', error);
        return null;
    }
}

/**
 * Get session ID from secure storage
 */
export async function getSessionId(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(storageKeys.sessionId);
    } catch (error) {
        console.error('Error getting session ID:', error);
        return null;
    }
}

/**
 * Clear all authentication tokens
 */
export async function clearTokens(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(storageKeys.accessToken);
        await SecureStore.deleteItemAsync(storageKeys.refreshToken);
        await SecureStore.deleteItemAsync(storageKeys.sessionId);
    } catch (error) {
        console.error('Error clearing tokens:', error);
        throw new Error('Failed to clear authentication tokens');
    }
}

/**
 * Check if user has valid tokens
 */
export async function hasValidTokens(): Promise<boolean> {
    try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();
        return !!(accessToken && refreshToken);
    } catch (error) {
        console.error('Error checking tokens:', error);
        return false;
    }
}

/**
 * Save emergency code securely (stored locally for authenticated re-viewing)
 */
export async function saveEmergencyCode(code: string, expiresAt: string): Promise<void> {
    try {
        const data = JSON.stringify({ code, expiresAt });
        await SecureStore.setItemAsync(storageKeys.emergencyCode, data);
    } catch (error) {
        console.error('Error saving emergency code:', error);
    }
}

/**
 * Get emergency code from secure storage
 */
export async function getEmergencyCode(): Promise<{ code: string; expiresAt: string } | null> {
    try {
        const data = await SecureStore.getItemAsync(storageKeys.emergencyCode);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting emergency code:', error);
        return null;
    }
}

/**
 * Clear emergency code from secure storage
 */
export async function clearEmergencyCode(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(storageKeys.emergencyCode);
    } catch (error) {
        console.error('Error clearing emergency code:', error);
    }
}

/**
 * Save biometrics enabled status
 */
export async function saveBiometricsEnabled(enabled: boolean): Promise<void> {
    try {
        await SecureStore.setItemAsync(storageKeys.biometricsEnabled, enabled ? 'true' : 'false');
    } catch (error) {
        console.error('Error saving biometrics preference:', error);
    }
}

/**
 * Get biometrics enabled status
 */
export async function getBiometricsEnabled(): Promise<boolean> {
    try {
        const enabled = await SecureStore.getItemAsync(storageKeys.biometricsEnabled);
        return enabled === 'true';
    } catch (error) {
        console.error('Error getting biometrics preference:', error);
        return false;
    }
}

/**
 * Save credentials for biometrics login
 */
export async function saveBiometricsCredentials(phoneNumber: string, pin: string): Promise<void> {
    try {
        const data = JSON.stringify({ phoneNumber, pin });
        await SecureStore.setItemAsync(storageKeys.biometricsCredentials, data);
    } catch (error) {
        console.error('Error saving biometrics credentials:', error);
    }
}

/**
 * Get credentials for biometrics login
 */
export async function getBiometricsCredentials(): Promise<{ phoneNumber: string, pin: string } | null> {
    try {
        const data = await SecureStore.getItemAsync(storageKeys.biometricsCredentials);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting biometrics credentials:', error);
        return null;
    }
}

/**
 * Clear all biometrics related data
 */
export async function clearBiometricsData(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(storageKeys.biometricsEnabled);
        await SecureStore.deleteItemAsync(storageKeys.biometricsCredentials);
    } catch (error) {
        console.error('Error clearing biometrics data:', error);
    }
}

/**
 * Save last phone number used to login
 */
export async function saveLastPhoneNumber(phone: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(storageKeys.lastPhoneNumber, phone);
    } catch (error) {
        console.error('Error saving last phone number:', error);
    }
}

/**
 * Get last phone number used to login
 */
export async function getLastPhoneNumber(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(storageKeys.lastPhoneNumber);
    } catch (error) {
        console.error('Error getting last phone number:', error);
        return null;
    }
}
