import * as authService from '@/services/authService';
import { useRegistrationStore } from '@/store/registrationStore';
import { RegistrationData } from '@/types';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook to send verification code
 */
export function useSendVerificationCode() {
    return useMutation({
        mutationFn: async (phone: string) => {
            const response = await authService.sendVerificationCode(phone);
            if (!response.success) {
                throw new Error(response.message || 'Error al enviar código de verificación');
            }
            return response;
        },
    });
}

/**
 * Hook to verify code
 */
export function useVerifyCode() {
    const { setPhoneVerified } = useRegistrationStore();

    return useMutation({
        mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
            const response = await authService.verifyCode(phone, code);
            if (!response.success || !response.data?.verified) {
                throw new Error(response.error || 'Código de verificación inválido');
            }
            return response;
        },
        onSuccess: () => {
            setPhoneVerified(true);
        },
    });
}


// Global flag to prevent duplicate registration calls
let isRegistering = false;

/**
 * Hook to register user
 */
export function useRegister() {
    const { resetRegistration } = useRegistrationStore();

    return useMutation({
        mutationFn: async (data: RegistrationData) => {
            // Prevent duplicate calls
            if (isRegistering) {
                throw new Error('Registration already in progress');
            }

            isRegistering = true;

            try {
                const response = await authService.register(data);
                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Error al registrar usuario');
                }
                return response.data;
            } finally {
                isRegistering = false;
            }
        },
        onSuccess: () => {
            // Don't reset here - let the component handle it after auto-login
            // resetRegistration();
        },
        retry: false, // Disable automatic retries
    });
}

/**
 * Combined registration hook
 */
export function useRegistration() {
    const registrationStore = useRegistrationStore();
    const sendCodeMutation = useSendVerificationCode();
    const verifyCodeMutation = useVerifyCode();
    const registerMutation = useRegister();

    return {
        // Store state
        userType: registrationStore.userType,
        phone: registrationStore.phone,
        verificationCode: registrationStore.verificationCode,
        isPhoneVerified: registrationStore.isPhoneVerified,
        personalData: registrationStore.personalData,
        pin: registrationStore.pin,
        currentStep: registrationStore.currentStep,

        // Store actions
        setUserType: registrationStore.setUserType,
        setPhone: registrationStore.setPhone,
        setVerificationCode: registrationStore.setVerificationCode,
        setPhoneVerified: registrationStore.setPhoneVerified,
        setPersonalData: registrationStore.setPersonalData,
        setPin: registrationStore.setPin,
        setCurrentStep: registrationStore.setCurrentStep,
        nextStep: registrationStore.nextStep,
        previousStep: registrationStore.previousStep,
        goToStep: registrationStore.goToStep,
        resetRegistration: registrationStore.resetRegistration,
        canProceedToStep: registrationStore.canProceedToStep,
        getRegistrationData: registrationStore.getRegistrationData,

        // Mutations
        sendCode: sendCodeMutation.mutate,
        sendCodeAsync: sendCodeMutation.mutateAsync,
        verifyCode: verifyCodeMutation.mutate,
        verifyCodeAsync: verifyCodeMutation.mutateAsync,
        register: registerMutation.mutate,
        registerAsync: registerMutation.mutateAsync,

        // Mutation states
        isSendingCode: sendCodeMutation.isPending,
        isVerifyingCode: verifyCodeMutation.isPending,
        isRegistering: registerMutation.isPending,
        sendCodeError: sendCodeMutation.error,
        verifyCodeError: verifyCodeMutation.error,
        registerError: registerMutation.error,
    };
}
