import { apiClient } from '@/lib/api-client';
import type {
    Member,
    DashboardStats,
    TimeRange,
    NikCheckResult,
    BeritaArticle,
} from '@/models/member.types';

function authHeaders(idToken: string) {
    return { headers: { Authorization: `Bearer ${idToken}` } };
}

/** Admin API service — all calls require admin idToken */
export const adminService = {
    /* ─── Members ─── */
    getAllMembers: async (
        idToken: string,
        params?: {
            search?: string;
            province_id?: string;
            regency_id?: string;
            district_id?: string;
            village_id?: string;
        }
    ): Promise<Member[]> => {
        const res = await apiClient.get('/api/admin/members', {
            params,
            ...authHeaders(idToken),
        });
        return res.data.data;
    },

    updateMemberRole: async (
        idToken: string,
        uid: string,
        payload: { role: string; kepengurusan?: any; organization?: any }
    ) => {
        const res = await apiClient.put(
            `/api/admin/members/${uid}/role`,
            payload,
            authHeaders(idToken)
        );
        return res.data;
    },

    /* ─── Stats ─── */
    getStats: async (
        idToken: string,
        range: TimeRange = 'weekly',
        date?: string
    ): Promise<DashboardStats> => {
        const res = await apiClient.get('/api/admin/stats', {
            params: { range, date },
            ...authHeaders(idToken),
        });
        return res.data.data;
    },

    /* ─── NIK Verification ─── */
    checkNik: async (
        idToken: string,
        nik?: string
    ): Promise<NikCheckResult[]> => {
        const res = await apiClient.get('/api/admin/verify-nik', {
            params: { nik },
            ...authHeaders(idToken),
        });
        return res.data.data;
    },

    /* ─── Regions (public endpoint, reused from member API) ─── */
    getRegions: async (
        type: 'provinces' | 'regencies' | 'districts' | 'villages',
        parentId?: string
    ) => {
        const res = await apiClient.get('/api/members/regions', {
            params: { type, parent_id: parentId },
        });
        return res.data.data;
    },

    /* ─── News CMS ─── */
    getNews: async (idToken: string): Promise<BeritaArticle[]> => {
        const res = await apiClient.get('/api/admin/news', authHeaders(idToken));
        return res.data.data;
    },

    /* ─── Media — signed upload ─── */
    getSignUpload: async (idToken: string, folder = 'news') => {
        const res = await apiClient.get('/api/media/sign-upload', {
            params: { folder },
            ...authHeaders(idToken),
        });
        return res.data;
    },
};
