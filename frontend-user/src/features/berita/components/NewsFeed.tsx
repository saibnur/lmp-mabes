'use client';

/**
 * NewsFeed.tsx
 * Infinite scroll, responsive 3-column feed using IntersectionObserver.
 * Responsive: 1 col (mobile), 2 cols (tablet md), 3 cols (desktop lg).
 * Skeleton loading cards while fetching.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getFeedPosts } from '@/lib/postService';
import PostCard from './PostCard';
import type { Post } from '@/lib/types';

const PAGE_SIZE = 12;

function SkeletonCard() {
    return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-[16/9] bg-slate-200" />
            <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-24 bg-slate-200 rounded" />
                        <div className="h-2 w-16 bg-slate-100 rounded" />
                    </div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-3/5" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
        </div>
    );
}

interface NewsFeedProps {
    category?: string;
    excludeIds?: string[];
    searchQuery?: string;
}

export default function NewsFeed({ category, excludeIds = [], searchQuery = '' }: NewsFeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // The sentinel element for IntersectionObserver
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadPosts = useCallback(
        async (nextCursor: string | null = null, reset = false) => {
            if (isFetching) return;
            setIsFetching(true);
            if (reset) setIsLoading(true);

            try {
                const result = await getFeedPosts({
                    limit: PAGE_SIZE,
                    ...(nextCursor ? { cursor: nextCursor } : {}),
                    ...(category ? { category } : {}),
                });

                const filtered = excludeIds.length > 0
                    ? result.posts.filter((p) => !excludeIds.includes(p.id!))
                    : result.posts;

                setPosts((prev) => (reset ? filtered : [...prev, ...filtered]));
                setCursor(result.nextCursor);
                setHasMore(result.hasMore);
                setError(null);
            } catch (err: any) {
                setError('Gagal memuat berita. Silakan coba lagi.');
                console.error('[NewsFeed] loadPosts error:', err);
            } finally {
                setIsLoading(false);
                setIsFetching(false);
            }
        },
        [category, isFetching]
    );

    // Initial load
    useEffect(() => {
        setPosts([]);
        setCursor(null);
        setHasMore(true);
        loadPosts(null, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current) return;

        observerRef.current?.disconnect();

        if (!hasMore) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetching && hasMore) {
                    loadPosts(cursor);
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(sentinelRef.current);

        return () => observerRef.current?.disconnect();
    }, [cursor, hasMore, isFetching, loadPosts]);

    // Skeleton loading (initial)
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 text-center text-slate-500 space-y-3">
                <p className="text-3xl">😞</p>
                <p className="text-sm font-medium">{error}</p>
                <button
                    onClick={() => loadPosts(null, true)}
                    className="mt-2 px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    // Client-side search filter with regex
    const visiblePosts = searchQuery.trim()
        ? (() => {
            try {
                const re = new RegExp(searchQuery.trim(), 'i');
                return posts.filter((p) =>
                    re.test(p.title || '') ||
                    re.test(p.author?.display_name || '') ||
                    re.test(p.content?.excerpt || '')
                );
            } catch {
                return posts;
            }
        })()
        : posts;

    if (visiblePosts.length === 0) {
        return (
            <div className="py-20 text-center text-slate-500 space-y-2">
                <p className="text-4xl">{searchQuery ? '🔍' : '📰'}</p>
                <p className="font-bold text-slate-700">
                    {searchQuery ? 'Tidak ada berita yang cocok' : 'Belum ada berita'}
                </p>
                <p className="text-sm">
                    {searchQuery
                        ? `Coba kata kunci lain untuk "${searchQuery}"`
                        : 'Belum ada post yang tersedia untuk wilayah Anda saat ini.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visiblePosts.map((post) => (
                    <PostCard key={post.id} post={post} searchQuery={searchQuery} />
                ))}

                {/* Skeleton cards while loading more */}
                {isFetching && !isLoading && (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                )}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />

            {/* End of feed message */}
            {!hasMore && posts.length > 0 && (
                <div className="py-8 text-center text-slate-400 text-sm font-medium">
                    Anda sudah melihat semua berita terbaru 🎉
                </div>
            )}
        </div>
    );
}
