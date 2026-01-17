import api from '@/lib/axios';

export interface CheckUsernameResponse {
    available: boolean;
    suggestions?: string[];
}

export interface UpdateUsernameResponse {
    message: string;
    username: string;
}

export interface GenerateQRResponse {
    qrCode: string;
    username: string;
    format: string;
}

export interface QRData {
    username: string;
    userId: number;
    name: string;
    role: string;
    platform: 'TuPasaje';
}

/**
 * Check if username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<CheckUsernameResponse> => {
    const response = await api.post('/users/username/check', { username });
    return response.data;
};

/**
 * Update user's username (permanent - cannot be changed once set)
 */
export const updateUsername = async (username: string): Promise<UpdateUsernameResponse> => {
    const response = await api.patch('/users/username', { username });
    return response.data;
};

/**
 * Generate QR code for user
 */
export const generateQRCode = async (size?: string, format?: string): Promise<GenerateQRResponse> => {
    const response = await api.post('/users/qr/generate', { size, format });
    return response.data;
};

/**
 * Get user by username (for QR scanning)
 */
export const getUserByUsername = async (username: string) => {
    const response = await api.get(`/users/search/username/${username}`);
    return response.data;
};

/**
 * Scan QR code and get user info
 */
export const scanQRCode = async (qrData: string) => {
    const response = await api.post('/users/qr/scan', { qrData });
    return response.data;
};
