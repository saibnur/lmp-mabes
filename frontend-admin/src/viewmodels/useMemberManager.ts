'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/viewmodels/useAuth';
import { useState, useMemo, useCallback } from 'react';
import type { Member, Kepengurusan } from '@/models/member.types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

function normalizePhone(raw: string): string {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('62')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
}

function normalizeKta(raw: string): string {
    return raw.replace(/[\.\s]/g, '');
}

export function useMemberManager() {
    const { idToken } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [regencyId, setRegencyId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [villageId, setVillageId] = useState('');
    const [page, setPage] = useState(1);

    const query = useQuery<Member[]>({
        queryKey: ['admin-members', provinceId, regencyId, districtId, villageId],
        queryFn: () =>
            adminService.getAllMembers(idToken!, {
                province_id: provinceId || undefined,
                regency_id: regencyId || undefined,
                district_id: districtId || undefined,
                village_id: villageId || undefined,
            }),
        enabled: !!idToken,
    });

    const filteredMembers = useMemo(() => {
        if (!query.data) return [];
        const raw = search.trim();
        if (!raw) return query.data;

        const q = raw.toLowerCase();
        const hasDigit = /\d/.test(raw);
        const qPhone = hasDigit ? normalizePhone(raw) : '';
        const qKta = normalizeKta(raw);

        return query.data.filter((m) => {
            if (m.displayName?.toLowerCase().includes(q)) return true;
            if (m.no_kta) {
                const ktaRaw = m.no_kta.toLowerCase();
                const ktaNorm = normalizeKta(m.no_kta);
                if (ktaRaw.includes(q) || (qKta && ktaNorm.includes(qKta))) return true;
            }
            if (m.email?.toLowerCase().includes(q)) return true;
            if (qPhone) {
                const storedRaw = (m.phoneNumber || m.phone || '').trim();
                if (storedRaw && normalizePhone(storedRaw).includes(qPhone)) return true;
            }
            return false;
        });
    }, [query.data, search]);

    const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
    const paginatedMembers = useMemo(
        () => filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filteredMembers, page]
    );

    const roleMutation = useMutation({
        mutationFn: ({ uid, role, kepengurusan, organization }: {
            uid: string;
            role: string;
            kepengurusan?: Kepengurusan | null;
            organization?: any;
        }) => adminService.updateMemberRole(idToken!, uid, { role, kepengurusan, organization }),

        onMutate: async ({ uid, role, kepengurusan, organization }) => {
            await queryClient.cancelQueries({ queryKey: ['admin-members'] });

            const previousData = queryClient.getQueriesData<Member[]>({
                queryKey: ['admin-members'],
            });

            // Optimistic update — langsung update cache tanpa tunggu server
            queryClient.setQueriesData<Member[]>(
                { queryKey: ['admin-members'] },
                (old) => {
                    if (!old) return old;
                    return old.map((m) =>
                        m.uid === uid
                            ? {
                                ...m,
                                role: role as Member['role'],
                                kepengurusan: kepengurusan ?? undefined,
                                ...(organization ? { organization: { ...m.organization, ...organization } } : {}),
                            }
                            : m
                    );
                }
            );

            return { previousData };
        },

        onSuccess: async () => {
            toast.success('Role berhasil diperbarui');
            await queryClient.invalidateQueries({
                queryKey: ['admin-members'],
                exact: false,
                refetchType: 'all',
            });
        },

        onError: (err: any, _vars, context: any) => {
            if (context?.previousData) {
                context.previousData.forEach(([queryKey, data]: any) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(err?.response?.data?.message || 'Gagal memperbarui role');
        },
    });

    const resetFilters = useCallback(() => {
        setProvinceId(''); setRegencyId(''); setDistrictId(''); setVillageId('');
        setSearch(''); setPage(1);
    }, []);

    const handleProvinceChange = useCallback((id: string) => {
        setProvinceId(id); setRegencyId(''); setDistrictId(''); setVillageId(''); setPage(1);
    }, []);

    const handleRegencyChange = useCallback((id: string) => {
        setRegencyId(id); setDistrictId(''); setVillageId(''); setPage(1);
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
        search,
        setSearch: (v: string) => { setSearch(v); setPage(1); },
        searchEmail: '', setSearchEmail: (_: string) => { },
        searchPhone: '', setSearchPhone: (_: string) => { },
        provinceId, regencyId, districtId, villageId,
        handleProvinceChange, handleRegencyChange,
        handleDistrictChange, handleVillageChange,
        resetFilters,
        updateRole: roleMutation.mutateAsync,
        isUpdatingRole: roleMutation.isPending,
    };
}