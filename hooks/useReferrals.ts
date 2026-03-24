import * as referralService from '@/services/referralService';
import { ReferralsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch the user's referral code
 */
export function useReferralCode() {
    return useQuery<string | null>({
        queryKey: ['referral-code'],
        queryFn: referralService.getReferralCode,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

/**
 * Hook to fetch the user's referral list and stats
 */
export function useMyReferrals() {
    return useQuery<ReferralsResponse>({
        queryKey: ['my-referrals'],
        queryFn: referralService.getMyReferrals,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
