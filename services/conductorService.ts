import api from '@/lib/axios';
import { ApiResponse, Transaction, TransactionFilters } from '@/types';

/**
 * Receive payment from passenger
 */
export async function receivePayment(
    amount: number,
    passengerId: string
): Promise<ApiResponse<Transaction>> {
    const response = await api.post<ApiResponse<Transaction>>('/conductor/receive-payment', {
        amount,
        passengerId,
    });
    return response.data;
}

/**
 * Get conductor transactions
 */
export async function getTransactions(
    filters?: TransactionFilters
): Promise<ApiResponse<Transaction[]>> {
    const response = await api.get<ApiResponse<Transaction[]>>('/conductor/transactions', {
        params: filters,
    });
    return response.data;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    const response = await api.get<ApiResponse<Transaction>>(`/conductor/transactions/${id}`);
    return response.data;
}

/**
 * Get conductor statistics
 */
export async function getStatistics(): Promise<ApiResponse<{
    totalReceived: number;
    transactionCount: number;
    averageTransaction: number;
}>> {
    const response = await api.get('/conductor/statistics');
    return response.data;
}
