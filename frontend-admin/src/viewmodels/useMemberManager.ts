'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/viewmodels/useAuth';
import { useState, useMemo, useCallback } from 'react';
import type { Member, Kepengurusan } from '@/models/member.types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

/** Normalize phone: "08xxx" → "628xxx" */
function normalizePhone(raw: string): string {
    const cleaned = raw.trim();
    return cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
}

export function useMemberManager() {
    const { idToken } = useAuth();
    const queryClient = useQueryClient();

    // Search & filter state
    const [search, setSearch] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [cityId, setCityId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [villageId, setVillageId] = useState('');
    const [page, setPage] = useState(1);

    // Fetch all members with region filters (server-side)
    const query = useQuery<Member[]>({
        queryKey: ['admin-members', provinceId, cityId, districtId, villageId],
        queryFn: () =>
            adminService.getAllMembers(idToken!, {
                province_id: provinceId || undefined,
                city_id: cityId || undefined,
                district_id: districtId || undefined,
                village_id: villageId || undefined,
            }),
        enabled: !!idToken,
    });

    // Client-side filtering (name, KTA, email, phone)
    const filteredMembers = useMemo(() => {
        if (!query.data) return [];
        let result = query.data;

        // Name / KTA
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            result = result.filter(
                (m) =>
                    (m.displayName && m.displayName.toLowerCase().includes(q)) ||
                    (m.no_kta && m.no_kta.toLowerCase().includes(q))
            );
        }

        // Email
        if (searchEmail.trim()) {
            const q = searchEmail.toLowerCase().trim();
            result = result.filter(
                (m) => m.email && m.email.toLowerCase().includes(q)
            );
        }

        // Phone — normalize "08xxx" → "628xxx"
        if (searchPhone.trim()) {
            const normalized = normalizePhone(searchPhone);
            const raw = searchPhone.trim();
            result = result.filter((m) => {
                const ph = (m.phoneNumber || m.phone || '').replace(/\s+/g, '');
                return ph.includes(normalized) || ph.includes(raw);
            });
        }

        return result;
    }, [query.data, search, searchEmail, searchPhone]);

    // Pagination
    const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
    const paginatedMembers = useMemo(
        () => filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredMembers, page]
    );

    // Update role mutation
    const roleMutation = useMutation({
        mutationFn: ({
            uid,
            role,
            kepengurusan,
        }: {
            uid: string;
            role: string;
            kepengurusan?: Kepengurusan | null;
        }) => adminService.updateMemberRole(idToken!, uid, { role, kepengurusan }),
        onSuccess: () => {
            toast.success('Role berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['admin-members'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal memperbarui role');
        },
    });

    // Reset all filters
    const resetFilters = useCallback(() => {
        setProvinceId('');
        setCityId('');
        setDistrictId('');
        setVillageId('');
        setSearch('');
        setSearchEmail('');
        setSearchPhone('');
        setPage(1);
    }, []);

    // Cascading region reset handlers
    const handleProvinceChange = useCallback((id: string) => {
        setProvinceId(id); setCityId(''); setDistrictId(''); setVillageId(''); setPage(1);
    }, []);
    const handleCityChange = useCallback((id: string) => {
        setCityId(id); setDistrictId(''); setVillageId(''); setPage(1);
    }, []);
    const handleDistrictChange = useCallback((id: string) => {
        setDistrictId(id); setVillageId(''); setPage(1);
    }, []);
    const handleVillageChange = useCallback((id: string) => {
        setVillageId(id); setPage(1);
    }, []);

    return {
        members: paginatedMembers,
        totalMembers: filteredMembers.length,
        totalPages,
        page,
        setPage,

        isLoading: query.isLoading,
        isError: query.isError,

        // Search
        search,
        setSearch: (v: string) => { setSearch(v); setPage(1); },
        searchEmail,
        setSearchEmail: (v: string) => { setSearchEmail(v); setPage(1); },
        searchPhone,
        setSearchPhone: (v: string) => { setSearchPhone(v); setPage(1); },

        // Region filters
        provinceId, cityId, districtId, villageId,
        handleProvinceChange, handleCityChange, handleDistrictChange, handleVillageChange,
        resetFilters,

        // Role update
        updateRole: roleMutation.mutateAsync,
        isUpdatingRole: roleMutation.isPending,
    };
}
