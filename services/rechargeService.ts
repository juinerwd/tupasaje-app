import api from '@/lib/axios';
import { RechargeRequest, RechargeResponse, Transaction, TransferResponse } from '@/types';

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

/**
 * Transfer funds to another user
 */
export async function transferFunds(data: { toUserId: number; amount: number; description?: string }): Promise<TransferResponse> {
    const response = await api.post<TransferResponse>('/payments/transfer', data);
    return response.data;
}
/**
 * Fictitious recharge for Beta testing
 */
export async function fictitiousRecharge(data: { amount: number }): Promise<RechargeResponse> {
    const response = await api.post<RechargeResponse>('/payments/recharge/fictitious', data);
    return response.data;
}
/**
 * Redeem a recharge code
 */
export async function redeemCode(code: string): Promise<RechargeResponse> {
    const response = await api.post<RechargeResponse>('/payments/recharge/redeem', { code });
    return response.data;
}
