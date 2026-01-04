import api from '@/lib/axios';
import {
    RechargeDto,
    RechargeResponse,
    Transaction,
    TransactionFilters,
    TransferDto,
    TransferResponse,
    WalletBalance,
} from '@/types';

/**
 * Recharge wallet with Wompi
 */
export async function recharge(data: RechargeDto): Promise<RechargeResponse> {
    const response = await api.post<RechargeResponse>('/payment/recharge', data);
    return response.data;
}

/**
 * Transfer money to another user
 */
export async function transfer(data: TransferDto): Promise<TransferResponse> {
    const response = await api.post<TransferResponse>('/payment/transfer', data);
    return response.data;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(`/payment/transaction/${id}`);
    return response.data;
}

/**
 * Get all transactions
 */
export async function getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/payment/transactions', {
        params: filters,
    });
    return response.data;
}

/**
 * Get balance (alias of /wallet/balance)
 */
export async function getBalance(): Promise<WalletBalance> {
    const response = await api.get<WalletBalance>('/payment/balance');
    return response.data;
}

/**
 * Get conductor information from QR code
 */
export async function getConductorInfo(qrData: string): Promise<{
    id: number;
    name: string;
    vehicle: string;
    plate: string;
    rating: number;
    amount: number;
}> {
    const response = await api.post('/payment/qr-info', { qrCode: qrData });
    return response.data;
}

/**
 * Pay transport using QR code
 */
export async function payTransport(qrData: string): Promise<{
    success: boolean;
    transaction: Transaction;
    newBalance: string;
}> {
    const response = await api.post('/payment/pay-transport', { qrCode: qrData });
    return response.data;
}
