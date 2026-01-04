import { PersonalData, UserRole } from '@/types';
import { create } from 'zustand';

interface RegistrationState {
    // Step 1: User type
    userType: UserRole | null;

    // Step 2: Phone verification
    phone: string;
    verificationCode: string;
    isPhoneVerified: boolean;

    // Step 3: Personal data
    personalData: PersonalData | null;

    // Step 4: PIN
    pin: string;

    // Current step (1-5)
    currentStep: number;

    // Actions
    setUserType: (type: UserRole) => void;
    setPhone: (phone: string) => void;
    setVerificationCode: (code: string) => void;
    setPhoneVerified: (verified: boolean) => void;
    setPersonalData: (data: PersonalData) => void;
    setPin: (pin: string) => void;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: number) => void;
    resetRegistration: () => void;

    // Getters
    canProceedToStep: (step: number) => boolean;
    getRegistrationData: () => any;
}

const initialState = {
    userType: null,
    phone: '',
    verificationCode: '',
    isPhoneVerified: false,
    personalData: null,
    pin: '',
    currentStep: 1,
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
    ...initialState,

    setUserType: (type) => set({ userType: type }),

    setPhone: (phone) => set({ phone }),

    setVerificationCode: (code) => set({ verificationCode: code }),

    setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

    setPersonalData: (data) => set({ personalData: data }),

    setPin: (pin) => set({ pin }),

    setCurrentStep: (step) => {
        if (step >= 1 && step <= 5) {
            set({ currentStep: step });
        }
    },

    nextStep: () => {
        const current = get().currentStep;
        if (current < 5) {
            set({ currentStep: current + 1 });
        }
    },

    previousStep: () => {
        const current = get().currentStep;
        if (current > 1) {
            set({ currentStep: current - 1 });
        }
    },

    goToStep: (step) => {
        if (step >= 1 && step <= 5 && get().canProceedToStep(step)) {
            set({ currentStep: step });
        }
    },

    resetRegistration: () => set(initialState),

    canProceedToStep: (step) => {
        const state = get();

        switch (step) {
            case 1:
                return true;
            case 2:
                return !!state.userType;
            case 3:
                return !!state.userType && !!state.phone && state.isPhoneVerified;
            case 4:
                return !!state.userType && !!state.phone && state.isPhoneVerified && !!state.personalData;
            case 5:
                return (
                    !!state.userType &&
                    !!state.phone &&
                    state.isPhoneVerified &&
                    !!state.personalData &&
                    !!state.pin
                );
            default:
                return false;
        }
    },

    getRegistrationData: () => {
        const state = get();
        return {
            firstName: state.personalData?.firstName || '',
            lastName: state.personalData?.lastName || '',
            typeDni: state.personalData?.idType || '',
            numberDni: state.personalData?.idNumber || '',
            email: state.personalData?.email || '',
            phoneNumber: state.phone,
            pin: state.pin,
            confirmPin: state.pin,
            role: state.userType || UserRole.PASSENGER,
            acceptTerms: true,
        };
    },
}));
