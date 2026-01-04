import api from '@/lib/axios';
import {
    ApiResponse,
    GeneratePaymentQRDto,
    PaymentQRData,
    ValidateQRDto,
    ValidateQRResponse,
} from '@/types';

/**
 * Generate a payment QR code
 */
export async function generatePaymentQR(dto: GeneratePaymentQRDto): Promise<PaymentQRData> {
    const response = await api.post<PaymentQRData>('/users/qr/payment', dto);
    return response.data;
}

/**
 * Validate a scanned QR code and process payment
 */
export async function validateQR(dto: ValidateQRDto): Promise<ValidateQRResponse> {
    const response = await api.post<ValidateQRResponse>('/users/qr/validate', dto);
    return response.data;
}

/**
 * Get all active payment QR codes for the current user
 */
export async function getActiveQRs(): Promise<PaymentQRData[]> {
    const response = await api.get<PaymentQRData[]>('/users/qr/active');
    return response.data;
}

/**
 * Cancel an active payment QR code
 */
export async function cancelQR(token: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/users/qr/${token}`);
    return response.data;
}
