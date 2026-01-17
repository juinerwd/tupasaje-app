import * as walletService from '@/services/walletService';
import { useAuthStore } from '@/store/authStore';
import { Wallet, WalletBalance } from '@/types';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch wallet balance
 */
export function useWalletBalance() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<WalletBalance>({
        queryKey: ['wallet', 'balance'],
        queryFn: async () => {
            return await walletService.getBalance();
        },
        enabled: isAuthenticated,
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every minute
    });
}

/**
 * Hook to fetch complete wallet details
 */
export function useWalletDetails() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<Wallet>({
        queryKey: ['wallet', 'details'],
        queryFn: async () => {
            return await walletService.getWallet();
        },
        enabled: isAuthenticated,
        staleTime: 60000, // 1 minute
    });
}
