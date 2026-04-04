import { apiClient } from './client';
import type { TransactionResponse } from '@/lib/types';

export const paymentApi = {
    // ── Midtrans (tidak dihapus) ──────────────────────────────────────────────
    createTransaction: (idToken: string) =>
        apiClient.post<TransactionResponse>('/api/payment/create-transaction', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    getTransactionStatus: (idToken: string, orderId: string) =>
        apiClient.get(`/api/payment/status/${orderId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    // ── Feature Flag ─────────────────────────────────────────────────────────
    getPaymentMode: () =>
        apiClient.get<{ success: boolean; mode: string }>('/api/payment/mode'),

    // ── Manual Payment ────────────────────────────────────────────────────────
    createManualOrder: (idToken: string) =>
        apiClient.post('/api/payment/manual/create-order', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    submitConfirmation: (idToken: string, payload: Record<string, string>) =>
        apiClient.post('/api/payment/manual/confirm', payload, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    uploadBukti: (idToken: string, file: File) => {
        const form = new FormData();
        form.append('bukti', file);
        return apiClient.post<{ success: boolean; url: string; public_id: string }>(
            '/api/payment/manual/upload-bukti',
            form,
            { headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'multipart/form-data' } }
        );
    },

    getMyConfirmationStatus: (idToken: string) =>
        apiClient.get('/api/payment/manual/my-status', {
            headers: { Authorization: `Bearer ${idToken}` },
        }),
};
