'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from './useAuth';
import type { TimeRange } from '@/models/member.types';

export function useDashboardStats() {
    const { idToken } = useAuth();
    const [range, setRange] = useState<TimeRange>('weekly');
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        // Default: today in YYYY-MM-DD (WIB)
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboardStats', range, range === 'hourly' ? selectedDate : null],
        queryFn: () => adminService.getStats(idToken!, range, range === 'hourly' ? selectedDate : undefined),
        enabled: !!idToken,
        staleTime: 2 * 60 * 1000, // 2 min
    });

    const handleRangeChange = useCallback((r: TimeRange) => {
        setRange(r);
    }, []);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    return {
        stats: data,
        isLoading,
        isError,
        range,
        setRange: handleRangeChange,
        selectedDate,
        setSelectedDate: handleDateChange,
        refetch,
    };
}
