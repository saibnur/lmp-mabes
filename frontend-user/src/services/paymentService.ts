import { apiClient } from '@/lib/api-client';

/**
 * Service for Payment related operations (Midtrans)
 */

export interface TransactionResponse {
    success: boolean;
    token: string;
    snapToken: string;
    redirect_url: string;
    orderId: string;
}

export const paymentService = {
    createTransaction: async (idToken: string): Promise<TransactionResponse> => {
        const response = await apiClient.post('/api/payment/create-transaction', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    // Webhook is handled by the server, but we might want to check status manually
    getTransactionStatus: async (idToken: string, orderId: string) => {
        const response = await apiClient.get(`/api/payment/status/${orderId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    }
};
