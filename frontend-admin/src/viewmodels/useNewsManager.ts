'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/viewmodels/useAuth';
import type { NewsItem } from '@/models/member.types';
import toast from 'react-hot-toast';

export function useNewsManager() {
    const { idToken } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery<NewsItem[]>({
        queryKey: ['admin-news'],
        queryFn: () => adminService.getNews(idToken!),
        enabled: !!idToken,
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt' | 'authorUid'>) =>
            adminService.createNews(idToken!, data),
        onSuccess: () => {
            toast.success('Berita berhasil dibuat');
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal membuat berita');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<NewsItem> }) =>
            adminService.updateNews(idToken!, id, data),
        onSuccess: () => {
            toast.success('Berita berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal memperbarui berita');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteNews(idToken!, id),
        onSuccess: () => {
            toast.success('Berita berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menghapus berita');
        },
    });

    return {
        news: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        createNews: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        updateNews: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        deleteNews: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
