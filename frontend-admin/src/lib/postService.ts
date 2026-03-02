/**
 * postService.ts — Frontend-Admin
 * All calls go through the backend REST API (Admin SDK on server side).
 * NO direct Firestore client SDK writes — ensures security rules are respected
 * and Cloudinary assets are synced properly.
 */

import apiClient from './api-client';
import type { Post, PostComment } from '@/models/member.types';

const BASE = '/api/posts';


// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthHeader(): Promise<Record<string, string>> {
    const { getFirebaseAuth } = await import('./firebase');
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('Pengguna tidak terautentikasi');
    const token = await user.getIdToken(true);
    return { Authorization: `Bearer ${token}` };
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export interface GetPostsParams {
    limit?: number;
    cursor?: string;
    category?: string;
}

export async function getPosts(params: GetPostsParams = {}): Promise<{
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
}> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get(BASE, { headers, params });
    return data;
}

export async function getPostById(postId: string): Promise<Post> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get(`${BASE}/${postId}`, { headers });
    return data.post;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreatePostPayload {
    title: string;
    content: { html_body: string; excerpt?: string; format?: string };
    media: {
        header_image: { url: string; public_id: string; width?: number | null; height?: number | null };
        inline_assets: { url: string; public_id: string; type?: string }[];
    };
    visibility: {
        scope: 'national' | 'regional';
        region_id: string;
        region_name: string;
        region_level: string;
        visible_to_ancestors?: boolean;
        visible_to_descendants?: boolean;
    };
    category: string;
    tags?: string[];
    status: 'draft' | 'published';
    is_pinned?: boolean;
}

export async function createPost(payload: CreatePostPayload): Promise<string> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.post(BASE, payload, { headers });
    return data.postId;
}

export async function updatePost(
    postId: string,
    payload: Partial<CreatePostPayload>
): Promise<void> {
    const headers = await getAuthHeader();
    await apiClient.put(`${BASE}/${postId}`, payload, { headers });
}

export async function deletePost(postId: string): Promise<void> {
    const headers = await getAuthHeader();
    await apiClient.delete(`${BASE}/${postId}`, { headers });
}

// ─── All Posts for Admin Table ─────────────────────────────────────────────────
export async function getAllPostsAdmin(): Promise<Post[]> {
    const headers = await getAuthHeader();
    // Admin sees all — fetch with generous limit, backend paginates
    const results: Post[] = [];
    let cursor: string | null = null;

    do {
        const response: { data: { posts: Post[]; nextCursor: string | null } } = await apiClient.get(BASE, {
            headers,
            params: { limit: 50, ...(cursor ? { cursor } : {}) },
        });
        const data = response.data;
        results.push(...(data.posts || []));
        cursor = data.nextCursor;
    } while (cursor);

    return results;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getComments(
    postId: string,
    cursor?: string
): Promise<{ comments: PostComment[]; nextCursor: string | null; hasMore: boolean }> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get(`${BASE}/${postId}/comments`, {
        headers,
        params: cursor ? { cursor } : {},
    });
    return data;
}

export async function addComment(
    postId: string,
    body: string,
    parentCommentId?: string
): Promise<PostComment> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.post(
        `${BASE}/${postId}/comments`,
        { body, parentCommentId: parentCommentId || null },
        { headers }
    );
    return data.comment;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
    const headers = await getAuthHeader();
    await apiClient.delete(`${BASE}/${postId}/comments/${commentId}`, { headers });
}

// ─── Migration (Admin Only) ────────────────────────────────────────────────────

export async function runMigration(): Promise<{
    total_migrated: number;
    total_skipped: number;
    errors: any[];
}> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.post('/api/admin/migrate/berita-to-posts', {}, { headers });
    return data;
}

export async function getMigrationStatus(): Promise<any> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get('/api/admin/migrate/status', { headers });
    return data;
}
