import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Configuración por defecto (en milisegundos)
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutos

interface AutoLogoutConfig {
    timeout?: number; // Tiempo de inactividad en ms
    onAutoLogout?: () => void; // Callback cuando se detecta inactividad
    enabled?: boolean; // Habilitar/deshabilitar el auto logout
}

export const useInactivityLogout = (config: AutoLogoutConfig = {}) => {
    const {
        timeout = DEFAULT_TIMEOUT,
        onAutoLogout,
        enabled = true
    } = config;

    const { isAuthenticated } = useAuthStore();

    const timeoutRef = useRef<number | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const backgroundTimeRef = useRef<number | null>(null);

    // Función para limpiar todos los timers
    const clearTimers = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // Función para notificar sobre inactividad
    const performAutoLogout = () => {
        // Solo ejecutar callback para mostrar el mensaje
        // El logout real se hará cuando el usuario presione "Entendido"
        if (onAutoLogout) {
            onAutoLogout();
        }
    };

    // Función para reiniciar los timers
    const resetTimers = () => {
        if (!enabled || !isAuthenticated) {
            return;
        }

        clearTimers();
        lastActivityRef.current = Date.now();

        // Timer para detectar inactividad
        timeoutRef.current = setTimeout(() => {
            performAutoLogout();
        }, timeout) as unknown as number;
    };

    // Función para manejar actividad del usuario
    const handleUserActivity = () => {
        if (!enabled || !isAuthenticated) {
            return;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;

        // Solo reiniciar si ha pasado más de 500ms desde la última actividad
        // (para evitar reiniciar constantemente pero ser más sensible que 1s)
        if (timeSinceLastActivity > 500) {
            resetTimers();
        }
    };

    // Función para manejar cambios de estado de la app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // La app vuelve al primer plano
            if (backgroundTimeRef.current) {
                const timeInBackground = Date.now() - backgroundTimeRef.current;
                // Si estuvo en segundo plano más tiempo que el timeout, notificar
                if (timeInBackground > timeout && enabled && isAuthenticated) {
                    performAutoLogout();
                    return;
                }

                // Si no, reiniciar los timers
                resetTimers();
            }
            backgroundTimeRef.current = null;
        } else if (nextAppState.match(/inactive|background/)) {
            // La app va a segundo plano
            backgroundTimeRef.current = Date.now();
            clearTimers();
        }

        appStateRef.current = nextAppState;
    };

    // Función pública para extender la sesión (reiniciar timers)
    const extendSession = () => {
        resetTimers();
    };

    // Función pública para obtener tiempo restante
    const getTimeRemaining = () => {
        if (!enabled || !isAuthenticated) {
            return 0;
        }

        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const remaining = Math.max(0, timeout - elapsed);

        return remaining;
    };

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            return;
        }

        if (isAuthenticated) {
            // Iniciar timers cuando el usuario se autentica
            resetTimers();

            // Listener para cambios de estado de la app
            const subscription = AppState.addEventListener('change', handleAppStateChange);

            return () => {
                subscription?.remove();
                clearTimers();
            };
        } else {
            // Limpiar timers si no está autenticado
            clearTimers();
        }
    }, [enabled, isAuthenticated, timeout]);

    // Limpiar timers al desmontar el componente
    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, []);

    return {
        handleUserActivity,
        extendSession,
        getTimeRemaining,
        clearTimers
    };
};