import api from '@/lib/axios';
import { CreateWithdrawalMethodDto, DriverProfile, DriverRidesResponse, DriverStatistics, Transaction, TransactionFilters, UpdateWithdrawalMethodDto, WithdrawalMethod } from '@/types';

/**
 * Get driver profile
 */
export async function getProfile(): Promise<DriverProfile> {
    const response = await api.get<DriverProfile>('/drivers/profile');
    return response.data;
}

/**
 * Update driver availability status
 */
export async function updateStatus(isAvailable: boolean): Promise<DriverProfile> {
    const response = await api.patch<DriverProfile>('/drivers/status', {
        isAvailable,
    });
    return response.data;
}

/**
 * Update driver profile (vehicle info)
 */
export async function updateProfile(data: any): Promise<DriverProfile> {
    const response = await api.patch<DriverProfile>('/drivers/profile', data);
    return response.data;
}

/**
 * Get conductor transactions
 */
export async function getTransactions(
    filters?: TransactionFilters
): Promise<DriverRidesResponse> {
    const response = await api.get<DriverRidesResponse>('/drivers/rides', {
        params: filters,
    });
    return response.data;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/drivers/transactions/${id}`);
    return response.data;
}

/**
 * Get conductor statistics (earnings)
 */
export async function getStatistics(): Promise<DriverStatistics> {
    const response = await api.get<DriverStatistics>('/drivers/earnings');
    return response.data;
}

/**
 * Request withdrawal
 */
export async function requestWithdrawal(amount: number, methodId: string): Promise<{
    success: boolean;
    amount: number;
    newBalance: number;
    message: string;
}> {
    const response = await api.post('/drivers/withdraw', { amount, methodId });
    return response.data;
}

/**
 * Get withdrawal methods
 */
export async function getWithdrawalMethods(): Promise<WithdrawalMethod[]> {
    const response = await api.get<WithdrawalMethod[]>('/drivers/withdrawal-methods');
    return response.data;
}

/**
 * Create withdrawal method
 */
export async function createWithdrawalMethod(dto: CreateWithdrawalMethodDto): Promise<WithdrawalMethod> {
    const response = await api.post<WithdrawalMethod>('/drivers/withdrawal-methods', dto);
    return response.data;
}

/**
 * Update withdrawal method
 */
export async function updateWithdrawalMethod(id: string, dto: UpdateWithdrawalMethodDto): Promise<WithdrawalMethod> {
    const response = await api.patch<WithdrawalMethod>(`/drivers/withdrawal-methods/${id}`, dto);
    return response.data;
}

/**
 * Delete withdrawal method
 */
export async function deleteWithdrawalMethod(id: string): Promise<void> {
    await api.delete(`/drivers/withdrawal-methods/${id}`);
}
