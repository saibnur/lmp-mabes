'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { Region } from '@/models/member.types';

/**
 * Cascading region data hook.
 * Fetches provinces → regencies → districts → villages.
 */
export function useRegions(
    provinceId?: string,
    cityId?: string,
    districtId?: string
) {
    const provinces = useQuery<Region[]>({
        queryKey: ['regions', 'provinces'],
        queryFn: () => adminService.getRegions('provinces'),
        staleTime: 24 * 60 * 60 * 1000, // Cache for 24h
    });

    const cities = useQuery<Region[]>({
        queryKey: ['regions', 'regencies', provinceId],
        queryFn: () => adminService.getRegions('regencies', provinceId!),
        enabled: !!provinceId,
        staleTime: 24 * 60 * 60 * 1000,
    });

    const districts = useQuery<Region[]>({
        queryKey: ['regions', 'districts', cityId],
        queryFn: () => adminService.getRegions('districts', cityId!),
        enabled: !!cityId,
        staleTime: 24 * 60 * 60 * 1000,
    });

    const villages = useQuery<Region[]>({
        queryKey: ['regions', 'villages', districtId],
        queryFn: () => adminService.getRegions('villages', districtId!),
        enabled: !!districtId,
        staleTime: 24 * 60 * 60 * 1000,
    });

    return {
        provinces: provinces.data ?? [],
        cities: cities.data ?? [],
        districts: districts.data ?? [],
        villages: villages.data ?? [],
        isLoadingProvinces: provinces.isLoading,
        isLoadingCities: cities.isLoading,
        isLoadingDistricts: districts.isLoading,
        isLoadingVillages: villages.isLoading,
    };
}
