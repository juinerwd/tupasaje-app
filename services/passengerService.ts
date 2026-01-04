import api from '@/lib/axios';
import {
    EmergencyCode,
    FavoriteLocation,
    PassengerProfile,
    Transaction,
    UpdatePassengerProfileDto,
} from '@/types';

/**
 * Get passenger profile
 */
export async function getProfile(): Promise<PassengerProfile> {
    const response = await api.get<PassengerProfile>('/passengers/profile');
    return response.data;
}

/**
 * Update passenger profile
 */
export async function updateProfile(data: UpdatePassengerProfileDto): Promise<PassengerProfile> {
    const response = await api.patch<PassengerProfile>('/passengers/profile', data);
    return response.data;
}

/**
 * Add favorite location
 */
export async function addFavoriteLocation(data: {
    name: string;
    address: string;
    lat: number;
    lng: number;
}): Promise<{ favoriteLocations: FavoriteLocation[] }> {
    const response = await api.post<{ favoriteLocations: FavoriteLocation[] }>(
        '/passengers/favorite-locations',
        data
    );
    return response.data;
}

/**
 * Delete favorite location
 */
export async function deleteFavoriteLocation(id: string): Promise<void> {
    await api.delete(`/passengers/favorite-locations/${id}`);
}

/**
 * Get payment history
 */
export async function getPaymentHistory(params?: {
    limit?: number;
    offset?: number;
}): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/passengers/payment-history', { params });
    return response.data;
}

/**
 * Generate emergency code
 */
export async function generateEmergencyCode(): Promise<EmergencyCode> {
    const response = await api.post<EmergencyCode>('/passengers/emergency-code');
    return response.data;
}

/**
 * Verify emergency code
 */
export async function verifyEmergencyCode(code: string): Promise<{ valid: boolean }> {
    const response = await api.post<{ valid: boolean }>('/passengers/verify-emergency-code', {
        code,
    });
    return response.data;
}
