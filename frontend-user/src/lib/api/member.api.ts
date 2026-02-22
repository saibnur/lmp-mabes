import { apiClient } from './client';
import type { Region, MemberProfile, ApiResponse } from '@/lib/types';

export const memberApi = {
    getRegions: (type: 'provinces' | 'regencies' | 'districts' | 'villages', parentId?: string) =>
        apiClient.get<{ success: boolean; data: Region[] }>('/api/members/regions', {
            params: { type, parent_id: parentId },
        }),

    updateProfile: (idToken: string, data: any) =>
        apiClient.post<ApiResponse<MemberProfile>>('/api/members/update-profile', data, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    checkNik: (idToken: string, nik: string) =>
        apiClient.post<{ success: boolean; exists: boolean }>('/api/members/check-nik', { nik }, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    getProfile: (idToken: string) =>
        apiClient.get<ApiResponse<MemberProfile>>('/api/members/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
        }),
};
