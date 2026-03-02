'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';

export interface Notification {
    id: string;
    type: 'like' | 'comment' | 'new_post' | 'system';
    actorName: string;
    actorPhotoURL?: string;
    postId?: string;
    postTitle?: string;
    message: string;
    read: boolean;
    createdAt: any;
}

export function useNotifications(uid: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!uid) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        const db = getFirestoreDb();
        const q = query(
            collection(db, 'notifications', uid, 'items'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const unsub = onSnapshot(q, (snap) => {
            const items: Notification[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
            setNotifications(items);
            setUnreadCount(items.filter((n) => !n.read).length);
        }, (err) => {
            console.error('[useNotifications]', err);
        });
        return () => unsub();
    }, [uid]);

    const markAllRead = useCallback(async () => {
        if (!uid) return;
        const db = getFirestoreDb();
        const unread = notifications.filter((n) => !n.read);
        if (unread.length === 0) return;
        const batch = writeBatch(db);
        unread.forEach((n) => {
            batch.update(doc(db, 'notifications', uid, 'items', n.id), { read: true });
        });
        await batch.commit().catch(console.error);
    }, [uid, notifications]);

    const deleteNotification = useCallback(async (notifId: string) => {
        if (!uid) return;
        const db = getFirestoreDb();
        await deleteDoc(doc(db, 'notifications', uid, 'items', notifId)).catch(console.error);
    }, [uid]);

    return { notifications, unreadCount, markAllRead, deleteNotification };
}
