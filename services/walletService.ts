import api from '@/lib/axios';
import { Transaction, Wallet, WalletBalance } from '@/types';

/**
 * Get complete wallet details
 */
export async function getWallet(): Promise<Wallet> {
    const response = await api.get<Wallet>('/wallet');
    return response.data;
}

/**
 * Get wallet balance (simplified)
 */
export async function getBalance(): Promise<WalletBalance> {
    const response = await api.get<WalletBalance>('/wallet/balance');
    return response.data;
}

/**
 * Get wallet transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/wallet/transactions');
    return response.data;
}
