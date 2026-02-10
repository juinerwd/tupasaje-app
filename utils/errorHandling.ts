import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from any error object,
 * specifically handling Axios errors from the backend.
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Ocurrió un error inesperado'): string {
    if (!error) return defaultMessage;

    // Handle Axios Errors
    if (error.isAxiosError || (error.response && error.config)) {
        const axiosError = error as AxiosError<any>;

        // Check for backend-provided message
        if (axiosError.response?.data?.message) {
            const message = axiosError.response.data.message;
            // If it's an array (from class-validator), join it
            if (Array.isArray(message)) {
                return message.join('. ');
            }
            return message;
        }

        // Handle specific HTTP status codes
        if (axiosError.response?.status === 401) {
            return 'No autorizado. Por favor, inicia sesión de nuevo.';
        }
        if (axiosError.response?.status === 403) {
            return 'No tienes permiso para realizar esta acción.';
        }
        if (axiosError.response?.status === 404) {
            return 'El recurso solicitado no fue encontrado.';
        }
        if (axiosError.response?.status === 500) {
            return 'Error interno del servidor. Inténtalo más tarde.';
        }
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
            return 'La conexión tardó demasiado. Revisa tu internet.';
        }
        if (axiosError.code === 'ERR_NETWORK') {
            return 'Error de red. Revisa tu conexión a internet.';
        }
    }

    // Handle standard Error instances
    if (error instanceof Error) {
        return error.message;
    }

    // Handle strings
    if (typeof error === 'string') {
        return error;
    }

    return defaultMessage;
}
