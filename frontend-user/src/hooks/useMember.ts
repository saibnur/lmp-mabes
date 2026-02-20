import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService, MemberProfile } from '@/services/memberService';
import { useAuth } from '@/hooks/useAuth'; // Assuming it exists or I might need to create it

export function useMemberProfile() {
    const { user, idToken } = useAuth(); // Need to verify if useAuth provides idToken
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['member-profile', user?.uid],
        queryFn: () => memberService.getProfile(idToken!),
        enabled: !!idToken && !!user,
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<MemberProfile>) =>
            memberService.updateProfile(idToken!, data),
        onSuccess: (updatedData) => {
            queryClient.setQueryData(['member-profile', user?.uid], updatedData);
        }
    });

    return {
        profile: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        updateProfile: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    };
}
