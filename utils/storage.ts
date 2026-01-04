import { storageKeys } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Set first time launch flag
 */
export async function setFirstTimeLaunch(value: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(storageKeys.firstTimeLaunch, JSON.stringify(value));
    } catch (error) {
        console.error('Error setting first time launch:', error);
    }
}

/**
 * Check if this is the first time launching the app
 */
export async function isFirstTimeLaunch(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(storageKeys.firstTimeLaunch);
        if (value === null) {
            return true; // First time if key doesn't exist
        }
        return JSON.parse(value);
    } catch (error) {
        console.error('Error checking first time launch:', error);
        return true; // Default to true on error
    }
}

/**
 * Clear all async storage data
 */
export async function clearStorage(): Promise<void> {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}
