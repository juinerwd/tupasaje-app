import * as conductorService from '@/services/conductorService';
import { TransactionFilters } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch conductor statistics
 */
export function useConductorStatistics() {
    return useQuery({
        queryKey: ['conductor', 'statistics'],
        queryFn: async () => {
            return await conductorService.getStatistics();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
    });
}

/**
 * Hook to fetch conductor transactions
 */
export function useConductorTransactions(filters?: TransactionFilters) {
    return useQuery({
        queryKey: ['conductor', 'transactions', filters],
        queryFn: async () => {
            return await conductorService.getTransactions(filters);
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Hook to fetch a single conductor transaction by ID
 */
export function useConductorTransaction(id: string) {
    return useQuery({
        queryKey: ['conductor', 'transaction', id],
        queryFn: async () => {
            return await conductorService.getTransactionById(id);
        },
        enabled: !!id,
    });
}

/**
 * Hook to fetch driver profile
 */
export function useDriverProfile() {
    return useQuery({
        queryKey: ['conductor', 'profile'],
        queryFn: async () => {
            return await conductorService.getProfile();
        },
    });
}

/**
 * Hook to update driver status
 */
export function useUpdateDriverStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (isAvailable: boolean) => conductorService.updateStatus(isAvailable),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'profile'] });
        },
    });
}

/**
 * Hook to request withdrawal
 */
export function useRequestWithdrawal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ amount, methodId }: { amount: number; methodId: string }) =>
            conductorService.requestWithdrawal(amount, methodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'statistics'] });
            queryClient.invalidateQueries({ queryKey: ['conductor', 'transactions'] });
        },
    });
}

/**
 * Hook to update driver profile (vehicle info)
 */
export function useUpdateDriverProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => conductorService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'profile'] });
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
        },
    });
}
