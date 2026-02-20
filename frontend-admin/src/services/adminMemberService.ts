import { apiClient } from '@/lib/api-client';

/**
 * Service for Admin Member Management
 */

export const adminMemberService = {
    getAllMembers: async (idToken: string) => {
        const response = await apiClient.get('/api/admin/members', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data.data;
    },

    updateMemberStatus: async (idToken: string, uid: string, status: string) => {
        const response = await apiClient.post(`/api/admin/members/${uid}/status`, { status }, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    }
};
