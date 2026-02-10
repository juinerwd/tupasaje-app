import * as passengerService from '@/services/passengerService';
import { useAuthStore } from '@/store/authStore';
import { PassengerProfile, UpdatePassengerProfileDto } from '@/types';
import { getErrorMessage } from '@/utils/errorHandling';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch passenger profile
 */
export function usePassengerProfile() {
    const { isAuthenticated } = useAuthStore();

    return useQuery<PassengerProfile>({
        queryKey: ['passenger', 'profile'],
        queryFn: async () => {
            return await passengerService.getProfile();
        },
        enabled: isAuthenticated,
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * Hook to update passenger profile
 */
export function useUpdatePassengerProfile() {
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();

    return useMutation({
        mutationFn: async (data: UpdatePassengerProfileDto) => {
            try {
                return await passengerService.updateProfile(data);
            } catch (error: any) {
                throw new Error(getErrorMessage(error, 'Error al actualizar el perfil'));
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['passenger', 'profile'] });
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });

            // If the response contains the updated user, sync it to the auth store
            if (data && (data as any).user) {
                setUser((data as any).user);
            }
        },
    });
}
/**
 * Hook to generate emergency code
 */
export function useGenerateEmergencyCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            try {
                return await passengerService.generateEmergencyCode();
            } catch (error: any) {
                throw new Error(getErrorMessage(error, 'Error al generar código de emergencia'));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passenger', 'profile'] });
        },
    });
}

/**
 * Hook to cancel emergency code
 */
export function useCancelEmergencyCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            try {
                return await passengerService.cancelEmergencyCode();
            } catch (error: any) {
                throw new Error(getErrorMessage(error, 'Error al cancelar código de emergencia'));
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['passenger', 'profile'] });
        },
    });
}
