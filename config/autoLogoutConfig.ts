/**
 * Configuración del sistema de logout automático
 * 
 * Este archivo permite personalizar los tiempos y comportamientos
 * del cierre de sesión automático por seguridad.
 */

export interface AutoLogoutConfig {
    // Tiempo de inactividad antes del logout (en minutos)
    timeoutMinutes: number;

    // Habilitar/deshabilitar el logout automático
    enabled: boolean;

    // Tiempo adicional cuando la app va a segundo plano (en minutos)
    backgroundTimeoutMinutes: number;

    // Mostrar logs de debug
    debugMode: boolean;
}

// Configuración por defecto
export const DEFAULT_AUTO_LOGOUT_CONFIG: AutoLogoutConfig = {
    timeoutMinutes: 15, // 15 minutos de inactividad
    enabled: true,      // Habilitado por defecto
    backgroundTimeoutMinutes: 5, // 5 minutos en segundo plano
    debugMode: __DEV__, // Solo en desarrollo
};

// Configuraciones predefinidas para diferentes niveles de seguridad
export const SECURITY_PROFILES = {
    // Alta seguridad - Para información financiera sensible
    HIGH_SECURITY: {
        timeoutMinutes: 5,   // 5 minutos
        enabled: true,
        backgroundTimeoutMinutes: 2, // 2 minutos en segundo plano
        debugMode: false,
    } as AutoLogoutConfig,

    // Seguridad media - Balance entre seguridad y experiencia
    MEDIUM_SECURITY: {
        timeoutMinutes: 15,  // 15 minutos
        enabled: true,
        backgroundTimeoutMinutes: 5, // 5 minutos en segundo plano
        debugMode: false,
    } as AutoLogoutConfig,

    // Seguridad baja - Para desarrollo o pruebas
    LOW_SECURITY: {
        timeoutMinutes: 30,  // 30 minutos
        enabled: true,
        backgroundTimeoutMinutes: 10, // 10 minutos en segundo plano
        debugMode: true,
    } as AutoLogoutConfig,

    // Deshabilitado - Solo para desarrollo
    DISABLED: {
        timeoutMinutes: 0,
        enabled: false,
        backgroundTimeoutMinutes: 0,
        debugMode: true,
    } as AutoLogoutConfig,
};

/**
 * Función para obtener la configuración actual
 * Puedes modificar esta función para cargar configuraciones desde:
 * - AsyncStorage
 * - Configuración remota
 * - Variables de entorno
 */
export const getAutoLogoutConfig = (): AutoLogoutConfig => {
    // En producción, usar alta seguridad para aplicaciones financieras
    if (process.env.NODE_ENV === 'production') {
        return SECURITY_PROFILES.HIGH_SECURITY;
    }

    // En desarrollo, usar configuración media
    return SECURITY_PROFILES.HIGH_SECURITY;
    //   return SECURITY_PROFILES.MEDIUM_SECURITY;
};

/**
 * Función para convertir configuración a milisegundos
 */
export const configToMilliseconds = (config: AutoLogoutConfig) => ({
    timeout: config.timeoutMinutes * 60 * 1000,
    backgroundTimeout: config.backgroundTimeoutMinutes * 60 * 1000,
    enabled: config.enabled,
    debugMode: config.debugMode,
});
