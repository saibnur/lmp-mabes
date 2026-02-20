import { apiClient } from '@/lib/api-client';

/**
 * Service for Member related operations
 */

export interface MemberProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string;
    nik?: string;
    no_kta?: string;
    photoURL?: string;
    ktpURL?: string;
    role: 'member' | 'admin';
    status: 'active' | 'inactive';
    membershipStatus: 'pending' | 'active' | 'expired';
    organization?: {
        province_id: string;
        city_id: string;
        district_id: string;
        village_id: string;
        [key: string]: any;
    };
}

export const memberService = {
    getProfile: async (idToken: string): Promise<MemberProfile> => {
        const response = await apiClient.get('/api/members/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data.data;
    },

    updateProfile: async (idToken: string, data: Partial<MemberProfile>): Promise<MemberProfile> => {
        const response = await apiClient.post('/api/members/update-profile', data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data.data;
    },

    getRegions: async (type: string, parentId?: string) => {
        const response = await apiClient.get('/api/members/regions', {
            params: { type, parent_id: parentId },
        });
        return response.data.data;
    }
};
