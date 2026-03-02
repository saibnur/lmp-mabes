'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getPostById } from '@/lib/postService';
import PostEditor from '@/components/news/PostEditor';
import type { Post } from '@/models/member.types';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPost() {
            try {
                const data = await getPostById(id);
                setPost(data);
            } catch (error) {
                console.error('[EditPostPage] fetch error:', error);
                router.push('/dashboard/news');
            } finally {
                setIsLoading(false);
            }
        }
        if (id) fetchPost();
    }, [id, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-text-muted text-sm">
                Memuat data post...
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center py-24 text-text-muted text-sm">
                Post tidak ditemukan
            </div>
        );
    }

    return <PostEditor mode="edit" initialPost={{ ...post, id }} />;
}
