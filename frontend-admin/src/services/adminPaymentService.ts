import { apiClient } from '@/lib/api-client';

function authHeaders(idToken: string) {
    return { headers: { Authorization: `Bearer ${idToken}` } };
}

export interface PaymentConfirmation {
    id: string;
    orderId: string;
    uid: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
    grossAmount: number;
    baseAmount?: number;
    uniqueCode?: number;
    adminNote?: string | null;
    expiredAt?: string | null;
    customerDetails: {
        name: string;
        phone: string;
        email: string;
    };
    confirmation?: {
        notes?: string;
        buktiUrl?: string | null;
        submittedAt?: string | null;
    } | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export const adminPaymentService = {
    /**
     * Ambil daftar konfirmasi pembayaran manual.
     * @param status filter: 'submitted' | 'approved' | 'rejected' | undefined (semua)
     */
    getPendingPayments: async (
        idToken: string,
        status?: string
    ): Promise<PaymentConfirmation[]> => {
        const res = await apiClient.get('/api/payment/manual/pending', {
            params: status ? { status } : undefined,
            ...authHeaders(idToken),
        });
        return res.data.data;
    },

    /**
     * Ambil jumlah konfirmasi pending (untuk badge sidebar).
     */
    getPendingCount: async (idToken: string): Promise<number> => {
        const res = await apiClient.get('/api/payment/manual/pending-count', authHeaders(idToken));
        return res.data.count ?? 0;
    },

    /** Admin approve pembayaran */
    approvePayment: async (
        idToken: string,
        orderId: string,
        reason?: string
    ) => {
        const res = await apiClient.post(
            '/api/payment/manual/approve',
            { orderId, action: 'approve', reason: reason || '' },
            authHeaders(idToken)
        );
        return res.data;
    },

    /** Admin reject pembayaran */
    rejectPayment: async (
        idToken: string,
        orderId: string,
        reason: string
    ) => {
        const res = await apiClient.post(
            '/api/payment/manual/approve',
            { orderId, action: 'reject', reason },
            authHeaders(idToken)
        );
        return res.data;
    },
};
