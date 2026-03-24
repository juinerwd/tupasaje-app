import api from '@/lib/axios';
import { ReferralsResponse } from '@/types';

/**
 * Get the current user's referral code
 */
export async function getReferralCode(): Promise<string | null> {
    const response = await api.get<{ code: string | null }>('/referrals/code');
    return response.data.code;
}

/**
 * Get the user's referral list and stats
 */
export async function getMyReferrals(): Promise<ReferralsResponse> {
    const response = await api.get<ReferralsResponse>('/referrals');
    return response.data;
}

/**
 * Apply a referral code
 */
export async function applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/referrals/apply', { code });
    return response.data;
}
