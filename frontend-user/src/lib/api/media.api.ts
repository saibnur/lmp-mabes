import { apiClient } from './client';
import type { CloudinarySignature } from '@/lib/types';

export const mediaApi = {
    getSignUpload: (idToken: string, folder = 'members') =>
        apiClient.get<CloudinarySignature>('/api/media/sign-upload', {
            params: { folder },
            headers: { Authorization: `Bearer ${idToken}` },
        }),
};
