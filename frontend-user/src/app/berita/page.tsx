'use client';

/**
 * /berita page — Social News Feed (Redesigned)
 * Features:
 *   - Personalized greeting with user display name
 *   - Search bar with regex filter + highlight
 *   - Hero section: pinned/top story
 *   - Trending: horizontal scrollable carousel
 *   - Latest: infinite scroll grid with category filter
 */

import { useState, useEffect, useMemo } from 'react';
import { getPinnedPost, getTrendingPosts } from '@/lib/postService';
import { useUserProfile } from '@/store/UserProfileProvider';
import NewsFeed from '@/features/berita/components/NewsFeed';
import HeroPostCard from '@/features/berita/components/HeroPostCard';
import MiniPostCard from '@/features/berita/components/MiniPostCard';
import type { Post } from '@/lib/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = [
    { value: '', label: 'Semua' },
    { value: 'berita', label: 'Berita' },
    { value: 'kegiatan', label: 'Kegiatan' },
    { value: 'acara', label: 'Acara' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'organisasi', label: 'Organisasi' },
];

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

function formatTodayDate(): string {
    return new Date().toLocaleDateString('id-ID', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

export default function BeritaPage() {
    const { profile } = useUserProfile();
    const [activeCategory, setActiveCategory] = useState('');
    const [heroPost, setHeroPost] = useState<Post | null>(null);
    const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
    const [sectionsLoaded, setSectionsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        async function loadSections() {
            const [pinned, trending] = await Promise.all([
                getPinnedPost(),
                getTrendingPosts(5),
            ]);
            setHeroPost(pinned);
            setTrendingPosts(trending);
            setSectionsLoaded(true);
        }
        loadSections();
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Collect IDs to exclude from the main feed to avoid duplicates
    const excludeIds = useMemo(() => {
        const ids: string[] = [];
        if (heroPost?.id) ids.push(heroPost.id);
        trendingPosts.forEach((p) => { if (p.id) ids.push(p.id); });
        return ids;
    }, [heroPost, trendingPosts]);

    const isSearching = searchQuery.trim().length > 0;

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="container mx-auto px-4 max-w-6xl pt-4">

                {/* Header — greeting + date */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                            {getGreeting()}
                        </p>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                            {profile?.displayName || 'Laskar Merah Putih'}
                        </h1>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm shrink-0">
                        {formatTodayDate()}
                    </span>
                </div>

                {/* Search bar */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Cari judul, penulis, atau isi berita…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition shadow-sm"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        className="h-11 w-11 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-200 hover:bg-red-700 transition active:scale-95 shrink-0"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </button>
                </div>

                {/* Category filter pills */}
                <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-slate-200 overflow-x-auto scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setActiveCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex-shrink-0
                                ${activeCategory === cat.value
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* ────── HERO: Top Story (hidden when searching) ────── */}
                {sectionsLoaded && heroPost && !activeCategory && !isSearching && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-black text-slate-900">Berita Utama</h2>
                        </div>
                        <HeroPostCard post={heroPost} />
                    </div>
                )}

                {/* ────── TRENDING carousel (hidden when searching) ────── */}
                {sectionsLoaded && trendingPosts.length > 0 && !activeCategory && !isSearching && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-black text-slate-900">Trending 🔥</h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                            {trendingPosts.map((post) => (
                                <MiniPostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ────── LATEST: Infinite scroll grid ────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-black text-slate-900">
                            {isSearching
                                ? `Hasil pencarian "${searchQuery}"`
                                : activeCategory
                                    ? CATEGORIES.find((c) => c.value === activeCategory)?.label || 'Berita'
                                    : 'Terbaru'}
                        </h2>
                    </div>
                    <NewsFeed
                        category={activeCategory || undefined}
                        excludeIds={activeCategory || isSearching ? [] : excludeIds}
                        searchQuery={searchQuery}
                    />
                </div>
            </div>
        </div>
    );
}
