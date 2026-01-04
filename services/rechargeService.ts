import api from '@/lib/axios';
import { RechargeRequest, RechargeResponse, Transaction } from '@/types';

/**
 * Initiate a wallet recharge
 */
export async function initiateRecharge(data: RechargeRequest): Promise<RechargeResponse> {
    const response = await api.post<RechargeResponse>('/payments/recharge', data);
    return response.data;
}

/**
 * Get recharge transaction by ID
 */
export async function getRechargeTransaction(transactionId: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/payments/transaction/${transactionId}`);
    return response.data;
}

/**
 * Get user's recharge history
 */
export async function getRechargeHistory(limit = 50, offset = 0): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/payments/transactions', {
        params: { limit, offset },
    });
    return response.data;
}

/**
 * Get wallet transactions (from wallet endpoint)
 */
export async function getWalletTransactions(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/wallet/transactions');
    return response.data;
}
