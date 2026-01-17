import * as promotionService from '@/services/promotionService';
import { Promotion } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

/**
 * Hook to fetch promotions
 */
export function usePromotions() {
    return useQuery<Promotion[]>({
        queryKey: ['promotions'],
        queryFn: promotionService.getPromotions,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to claim a promotion
 */
export function useClaimPromotion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (promotionId: string) => promotionService.claimPromotion(promotionId),
        onSuccess: (data) => {
            if (data.success) {
                Alert.alert('Éxito', data.message);
                queryClient.invalidateQueries({ queryKey: ['promotions'] });
            } else {
                Alert.alert('Error', data.message || 'No se pudo reclamar la promoción');
            }
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Ocurrió un error al reclamar la promoción');
        }
    });
}
