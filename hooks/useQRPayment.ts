import * as qrPaymentService from '@/services/qrPaymentService';
import { GeneratePaymentQRDto, PaymentQRData, ValidateQRDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to generate a payment QR code
 */
export function useGeneratePaymentQR() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: GeneratePaymentQRDto) => qrPaymentService.generatePaymentQR(dto),
        onSuccess: () => {
            // Invalidate active QRs to refresh the list
            queryClient.invalidateQueries({ queryKey: ['qr', 'active'] });
        },
        onError: (error: any) => {
            console.error('Error generating payment QR:', error);
        },
    });
}

/**
 * Hook to validate a scanned QR code
 */
export function useValidateQR() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: ValidateQRDto) => qrPaymentService.validateQR(dto),
        onSuccess: () => {
            // Invalidate wallet balance and transactions
            queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
            queryClient.invalidateQueries({ queryKey: ['qr', 'active'] });
        },
        onError: (error: any) => {
            console.error('Error validating QR:', error);
        },
    });
}

/**
 * Hook to get active payment QR codes
 */
export function useActiveQRs() {
    return useQuery<PaymentQRData[]>({
        queryKey: ['qr', 'active'],
        queryFn: () => qrPaymentService.getActiveQRs(),
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: 30 * 1000, // Refetch every 30 seconds to update expiration status
    });
}

/**
 * Hook to cancel a payment QR code
 */
export function useCancelQR() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (token: string) => qrPaymentService.cancelQR(token),
        onSuccess: () => {
            // Invalidate active QRs to refresh the list
            queryClient.invalidateQueries({ queryKey: ['qr', 'active'] });
        },
        onError: (error: any) => {
            console.error('Error canceling QR:', error);
        },
    });
}
