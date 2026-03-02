'use client';

import { useState, useEffect } from 'react';
import { getAllPostsAdmin, deletePost } from '@/lib/postService';
import PostsTable from '@/components/news/PostsTable';
import type { Post } from '@/models/member.types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function NewsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const data = await getAllPostsAdmin();
            setPosts(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil daftar post');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await deletePost(id);
            toast.success('Post dan semua asetnya berhasil dihapus');
            fetchPosts();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message || 'Gagal menghapus post');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Berita & CMS</h1>
                    <p className="text-sm text-text-muted">
                        Kelola semua berita, acara, dan kegiatan
                    </p>
                </div>

                <Link
                    href="/dashboard/news/buat"
                    className="hidden lg:flex items-center gap-2 shrink-0
                               rounded-xl bg-red-600 px-5 py-2.5
                               text-sm font-bold text-white
                               hover:bg-red-700 active:scale-[0.97]
                               shadow-md shadow-red-600/20 transition-all duration-150"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Buat Post
                </Link>
            </div>

            <PostsTable
                posts={posts}
                isLoading={isLoading}
                onDelete={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}