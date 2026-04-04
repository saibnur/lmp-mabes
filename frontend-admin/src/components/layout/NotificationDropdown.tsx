'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, X, CheckCheck, Heart, MessageSquare, Newspaper, Info } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

interface Props {
    uid: string | null;
}

function parseTimestamp(ts: any): Date | null {
    if (!ts) return null;

    // 1. Firebase SDK Timestamp
    if (typeof ts?.toDate === 'function') return ts.toDate();

    // 2. REST API Timestamp Object
    if (typeof ts === 'object' && ts._seconds != null) {
        return new Date(ts._seconds * 1000);
    }

    // 3. String atau Number
    let d = new Date(ts);

    // Jika gagal parsing dan inputnya String, coba bersihkan spasi standar SQL
    if (isNaN(d.getTime()) && typeof ts === 'string') {
        const sqlFormat = ts.replace(' ', 'T');
        d = new Date(sqlFormat);
    }

    return isNaN(d.getTime()) ? null : d;
}

function timeAgo(ts: any): string {
    const d = parseTimestamp(ts); if (!d) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
    return `${Math.floor(diff / 86400)}h`;
}

function NotifIcon({ type }: { type: Notification['type'] }) {
    if (type === 'like') return <Heart className="h-3.5 w-3.5 text-red-500 fill-red-100" />;
    if (type === 'comment') return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
    if (type === 'new_post') return <Newspaper className="h-3.5 w-3.5 text-emerald-500" />;
    return <Info className="h-3.5 w-3.5 text-slate-400" />;
}

export default function NotificationDropdown({ uid }: Props) {
    const { notifications, unreadCount, markAllRead, deleteNotification } = useNotifications(uid);
    const [open, setOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen((v) => !v);
        if (!open && unreadCount > 0) markAllRead();
    };

    if (!uid) return null;

    return (
        <div className="relative" ref={dropRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Notifikasi"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80 z-[100] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900">Notifikasi</h3>
                        {notifications.some((n) => !n.read) && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 space-y-2">
                                <Bell className="h-8 w-8 mx-auto opacity-30" />
                                <p className="text-sm font-medium">Tidak ada notifikasi</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex gap-3 px-4 py-3 group transition-colors ${notif.read ? 'bg-white' : 'bg-red-50/60'}`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {notif.actorPhotoURL ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={notif.actorPhotoURL}
                                                alt=""
                                                className="h-8 w-8 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                                <NotifIcon type={notif.type} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {notif.postId ? (
                                            <Link
                                                href={`/dashboard/news/${notif.postId}`}
                                                onClick={() => setOpen(false)}
                                                className="block"
                                            >
                                                <p className="text-xs font-semibold text-slate-800 leading-snug">
                                                    {notif.message}
                                                </p>
                                                {notif.postTitle && (
                                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                        📰 {notif.postTitle}
                                                    </p>
                                                )}
                                            </Link>
                                        ) : (
                                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                                                {notif.message}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                    </div>

                                    <button
                                        onClick={() => deleteNotification(notif.id)}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all mt-0.5"
                                        title="Hapus notifikasi"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
