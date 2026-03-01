'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from './useAuth';
import type { TimeRange } from '@/models/member.types';

export function useDashboardStats() {
    const { idToken } = useAuth();
    const [range, setRangeState] = useState<TimeRange>('weekly');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboardStats', range],
        queryFn: () => adminService.getStats(idToken!, range),
        enabled: !!idToken,
        staleTime: 2 * 60 * 1000,
        // Retry sekali jika gagal — handle kasus token belum siap
        retry: 1,
        retryDelay: 500,
    });

    const setRange = useCallback((r: TimeRange) => {
        setRangeState(r);
    }, []);

    return {
        stats: data,
        isLoading,
        isError,
        range,
        setRange,
        refetch,
    };
}