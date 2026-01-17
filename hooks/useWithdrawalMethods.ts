import * as conductorService from '@/services/conductorService';
import { CreateWithdrawalMethodDto, UpdateWithdrawalMethodDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to get all withdrawal methods for the conductor
 */
export function useWithdrawalMethods() {
    return useQuery({
        queryKey: ['conductor', 'withdrawal-methods'],
        queryFn: conductorService.getWithdrawalMethods,
    });
}

/**
 * Hook to create a new withdrawal method
 */
export function useCreateWithdrawalMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateWithdrawalMethodDto) => conductorService.createWithdrawalMethod(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'withdrawal-methods'] });
        },
    });
}

/**
 * Hook to update an existing withdrawal method
 */
export function useUpdateWithdrawalMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateWithdrawalMethodDto }) =>
            conductorService.updateWithdrawalMethod(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'withdrawal-methods'] });
        },
    });
}

/**
 * Hook to delete a withdrawal method
 */
export function useDeleteWithdrawalMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => conductorService.deleteWithdrawalMethod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conductor', 'withdrawal-methods'] });
        },
    });
}
