import * as rechargeService from '@/services/rechargeService';
import { RechargeRequest } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to initiate a wallet recharge
 */
export function useInitiateRecharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: RechargeRequest) => rechargeService.initiateRecharge(data),
        onSuccess: () => {
            // Invalidate wallet balance and transactions
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recharge', 'history'] });
        },
        onError: (error: any) => {
            console.error('Error initiating recharge:', error);
        },
    });
}

/**
 * Hook to get recharge transaction details
 */
export function useRechargeTransaction(transactionId: string, enabled = true) {
    return useQuery({
        queryKey: ['recharge', 'transaction', transactionId],
        queryFn: () => rechargeService.getRechargeTransaction(transactionId),
        enabled: enabled && !!transactionId,
        refetchInterval: (query) => {
            const data = query.state.data as any;
            // Stop refetching if transaction is completed or failed
            if (data?.status === 'APPROVED' || data?.status === 'DECLINED' || data?.status === 'VOIDED') {
                return false;
            }
            // Refetch every 3 seconds while pending/processing
            return 3000;
        },
    });
}

/**
 * Hook to get recharge history
 */
export function useRechargeHistory(limit = 50, offset = 0) {
    return useQuery({
        queryKey: ['recharge', 'history', limit, offset],
        queryFn: () => rechargeService.getRechargeHistory(limit, offset),
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to get wallet transactions
 */
export function useWalletTransactions() {
    return useQuery({
        queryKey: ['wallet', 'transactions'],
        queryFn: () => rechargeService.getWalletTransactions(),
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to transfer funds to another user
 */
export function useTransferFunds() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { toUserId: number; amount: number; description?: string }) =>
            rechargeService.transferFunds(data),
        onSuccess: () => {
            // Invalidate wallet balance and transactions
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
        },
        onError: (error: any) => {
            console.error('Error transferring funds:', error);
        },
    });
}
/**
 * Hook to perform a fictitious recharge (Beta)
 */
export function useFictitiousRecharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { amount: number }) => rechargeService.fictitiousRecharge(data),
        onSuccess: () => {
            // Invalidate wallet balance and transactions
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recharge', 'history'] });
        },
        onError: (error: any) => {
            console.error('Error in fictitious recharge:', error);
        },
    });
}

/**
 * Hook to redeem a recharge code
 */
export function useRedeemCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (code: string) => rechargeService.redeemCode(code),
        onSuccess: () => {
            // Invalidate wallet balance and transactions
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recharge', 'history'] });
        },
        onError: (error: any) => {
            console.error('Error redeeming code:', error);
        },
    });
}
