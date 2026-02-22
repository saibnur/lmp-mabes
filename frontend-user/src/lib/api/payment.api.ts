import { apiClient } from './client';
import type { TransactionResponse } from '@/lib/types';

export const paymentApi = {
    createTransaction: (idToken: string) =>
        apiClient.post<TransactionResponse>('/api/payment/create-transaction', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    getTransactionStatus: (idToken: string, orderId: string) =>
        apiClient.get(`/api/payment/status/${orderId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),
};
