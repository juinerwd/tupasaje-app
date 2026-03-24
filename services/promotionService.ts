import api from '@/lib/axios';
import { Promotion } from '@/types';

/**
 * Fetch active promotions from the backend API
 */
export const getPromotions = async (): Promise<Promotion[]> => {
    try {
        const response = await api.get<Promotion[]>('/promotions/active');
        return response.data;
    } catch (error) {
        // Return empty array on error to avoid breaking the UI
        console.warn('Failed to fetch promotions:', error);
        return [];
    }
};

/**
 * Claim a promotion (placeholder for future use)
 */
export const claimPromotion = async (promotionId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/promotions/${promotionId}/claim`);
    return response.data;
};
