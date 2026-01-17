import { AuthTokens, User } from '@/types';
import { clearTokens as clearSecureTokens, saveTokens } from '@/utils/secureStorage';
import { create } from 'zustand';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    inactivityTimer: NodeJS.Timeout | null;
    logoutReason: 'manual' | 'inactivity' | null;

    // Actions
    setUser: (user: User | null) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setTokens: (tokens: AuthTokens) => Promise<void>;
    setLoading: (loading: boolean) => void;
    login: (user: User, tokens: AuthTokens) => Promise<void>;
    logout: (reason?: 'manual' | 'inactivity') => Promise<void>;
    updateProfile: (user: Partial<User>) => void;
    setInactivityTimer: (timer: NodeJS.Timeout | null) => void;
    clearInactivityTimer: () => void;
    clearLogoutReason: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    inactivityTimer: null,
    logoutReason: null,

    setUser: (user) => {
        set({
            user,
            // Only set isAuthenticated to true if user is provided
            // If user is null, we might still be authenticated (tokens exist)
            // but we don't have the user data yet.
            isAuthenticated: user ? true : get().isAuthenticated,
            isLoading: false,
        });
    },

    setIsAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
    },

    setTokens: async (tokens) => {
        try {
            await saveTokens(tokens.accessToken, tokens.refreshToken, tokens.sessionId);
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },

    login: async (user, tokens) => {
        try {
            await saveTokens(tokens.accessToken, tokens.refreshToken, tokens.sessionId);
            set({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    },

    logout: async (reason: 'manual' | 'inactivity' = 'manual') => {
        try {
            // Clear inactivity timer
            get().clearInactivityTimer();

            // Clear tokens from secure storage
            await clearSecureTokens();

            // Reset state
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                inactivityTimer: null,
                logoutReason: reason,
            });
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    },

    updateProfile: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
            set({ user: { ...currentUser, ...userData } });
        }
    },

    setInactivityTimer: (timer) => {
        // Clear existing timer if any
        const existingTimer = get().inactivityTimer;
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        set({ inactivityTimer: timer });
    },

    clearInactivityTimer: () => {
        const timer = get().inactivityTimer;
        if (timer) {
            clearTimeout(timer);
            set({ inactivityTimer: null });
        }
    },

    clearLogoutReason: () => {
        set({ logoutReason: null });
    },
}));
