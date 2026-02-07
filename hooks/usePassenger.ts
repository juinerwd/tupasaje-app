import * as passengerService from '@/services/passengerService';
import { useAuthStore } from '@/store/authStore';
import { PassengerProfile, UpdatePassengerProfileDto } from '@/types';
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
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to update passenger profile
 */
export function useUpdatePassengerProfile() {
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();

    return useMutation({
        mutationFn: (data: UpdatePassengerProfileDto) => passengerService.updateProfile(data),
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
