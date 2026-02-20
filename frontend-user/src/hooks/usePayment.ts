import { useMutation } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/hooks/useAuth';

export function usePayment() {
    const { idToken } = useAuth();

    const createTransactionMutation = useMutation({
        mutationFn: () => paymentService.createTransaction(idToken!),
        onSuccess: (data) => {
            // Logic to trigger Midtrans Snap can go here or in the UI component
            console.log('Transaction created:', data);
        },
        onError: (error) => {
            console.error('Payment error:', error);
        }
    });

    return {
        createTransaction: createTransactionMutation.mutateAsync,
        isCreating: createTransactionMutation.isPending,
        error: createTransactionMutation.error,
    };
}
