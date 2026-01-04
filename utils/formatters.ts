/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(dateObj);
}

/**
 * Format date of birth (handles UTC dates correctly to avoid timezone offset)
 */
export function formatDateOfBirth(dateString: string): string {
    if (!dateString) return '';

    // Parse the date as UTC to avoid timezone offset issues
    const date = new Date(dateString);

    // Extract year, month, day in UTC
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    // Create a new date in local timezone with the same values
    const localDate = new Date(year, month, day);

    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(localDate);
}

/**
 * Format date of birth with weekday
 */
export function formatDateOfBirthLong(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const localDate = new Date(year, month, day);

    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(localDate);
}

/**
 * Format date and time to readable string
 */
export function formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}

/**
 * Format phone number (Colombian format)
 * Example: 3001234567 -> 300 123 4567
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
}

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Hace un momento';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
}

/**
 * Mask sensitive data (e.g., phone number, email)
 */
export function maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return `***${phone.slice(-4)}`;
}

export function maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    const maskedUsername = username.length > 2
        ? `${username[0]}***${username[username.length - 1]}`
        : username;
    return `${maskedUsername}@${domain}`;
}
