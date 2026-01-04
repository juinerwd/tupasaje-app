import api from '@/lib/axios';
import { ApiResponse, UpdateProfileDto, User } from '@/types';

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileDto): Promise<ApiResponse<User>> {
    try {
        const response = await api.patch<User>('/users/profile', data);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        throw error;
    }
}

/**
 * Get profile completeness
 */
export async function getProfileCompleteness(): Promise<{ completeness: number; completed: boolean; missing: string[] }> {
    const response = await api.get<{ completeness: number; completed: boolean; missing: string[] }>('/users/profile/completeness');
    return response.data;
}
