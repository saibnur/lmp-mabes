/**
 * postService.ts — Frontend-User
 * Service layer for the `posts` Firestore collection (social news feed).
 * All write operations (like, comment) hit the backend REST API.
 * Read operations use the API as well for region-scoped access.
 */

import { apiClient } from '@/lib/api/client';
import type { Post, PostComment } from '@/lib/types';

const BASE = '/api/posts';


// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthHeader(): Promise<Record<string, string>> {
    try {
        const { getFirebaseAuth } = await import('@/lib/firebase');
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (!user) return {}; // Guest — no Authorization header
        const token = await user.getIdToken(true);
        return { Authorization: `Bearer ${token}` };
    } catch {
        return {};
    }
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export interface FeedResult {
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
}

export async function getFeedPosts(params: {
    limit?: number;
    cursor?: string;
    category?: string;
} = {}): Promise<FeedResult> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get(BASE, { headers, params });
    return {
        posts: data.posts ?? [],
        nextCursor: data.nextCursor ?? null,
        hasMore: data.hasMore ?? false,
    };
}

export async function getPostById(postId: string): Promise<Post> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.get(`${BASE}/${postId}`, { headers });
    return data.post;
}

export async function getPinnedPost(): Promise<Post | null> {
    try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.get(`${BASE}/pinned`, { headers });
        return data.post ?? null;
    } catch {
        return null;
    }
}

export async function getTrendingPosts(limit = 5): Promise<Post[]> {
    try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.get(`${BASE}/trending`, { headers, params: { limit } });
        return data.posts ?? [];
    } catch {
        return [];
    }
}

// ─── Fallback to legacy berita collection ─────────────────────────────────────
// Used by [id]/page.tsx for backward compatibility with old URLs
export async function getLegacyArticle(id: string) {
    const { getArticleById } = await import('@/lib/beritaService');
    return getArticleById(id);
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function toggleLike(
    postId: string
): Promise<{ liked: boolean; like_count: number }> {
    const headers = await getAuthHeader();
    const { data } = await apiClient.post(`${BASE}/${postId}/like`, {}, { headers });
    return { liked: data.liked, like_count: data.like_count };
}

export async function checkLike(postId: string): Promise<boolean> {
    try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.get(`${BASE}/${postId}/likes/check`, { headers });
        return data.liked ?? false;
    } catch {
        return false;
    }
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
    return {
        comments: data.comments ?? [],
        nextCursor: data.nextCursor ?? null,
        hasMore: data.hasMore ?? false,
    };
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
