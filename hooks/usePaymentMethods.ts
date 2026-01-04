import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { CreatePaymentMethodDto, PaymentMethod, UpdatePaymentMethodDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch all payment methods
 */
export function usePaymentMethods() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<PaymentMethod[]>({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const response = await api.get<PaymentMethod[]>('/payment-methods');
            return response.data;
        },
        enabled: isAuthenticated,
    });
}

/**
 * Hook to get Wompi acceptance token
 */
export function useWompiAcceptanceToken() {
    return useQuery<string>({
        queryKey: ['wompi', 'acceptance-token'],
        queryFn: async () => {
            const response = await api.get<string>('/payment-methods/acceptance-token');
            return response.data;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

/**
 * Hook to create a new payment method
 */
export function useCreatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreatePaymentMethodDto) => {
            const response = await api.post<PaymentMethod>('/payment-methods', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}

/**
 * Hook to update a payment method
 */
export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdatePaymentMethodDto }) => {
            const response = await api.patch<PaymentMethod>(`/payment-methods/${id}`, dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}

/**
 * Hook to delete a payment method
 */
export function useDeletePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/payment-methods/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}
