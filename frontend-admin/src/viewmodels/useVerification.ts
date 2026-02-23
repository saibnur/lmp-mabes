'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/viewmodels/useAuth';
import type { NikCheckResult } from '@/models/member.types';

export function useVerification() {
    const { idToken } = useAuth();

    const query = useQuery<NikCheckResult[]>({
        queryKey: ['admin-nik-duplicates'],
        queryFn: () => adminService.checkNik(idToken!),
        enabled: !!idToken,
    });

    return {
        duplicates: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
    };
}
