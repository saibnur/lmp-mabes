import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMemberService } from '@/services/adminMemberService';

export function useAdminMembers(idToken: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['admin-members'],
        queryFn: () => adminMemberService.getAllMembers(idToken!),
        enabled: !!idToken,
    });

    const statusMutation = useMutation({
        mutationFn: ({ uid, status }: { uid: string; status: string }) =>
            adminMemberService.updateMemberStatus(idToken!, uid, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-members'] });
        }
    });

    return {
        members: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        updateStatus: statusMutation.mutateAsync,
        isUpdating: statusMutation.isPending,
    };
}
