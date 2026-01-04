import { storageKeys } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';

/**
 * Save authentication tokens securely
 */
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(storageKeys.accessToken, accessToken);
        await SecureStore.setItemAsync(storageKeys.refreshToken, refreshToken);
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
 * Clear all authentication tokens
 */
export async function clearTokens(): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(storageKeys.accessToken);
        await SecureStore.deleteItemAsync(storageKeys.refreshToken);
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
