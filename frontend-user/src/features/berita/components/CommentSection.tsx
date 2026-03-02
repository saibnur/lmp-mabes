'use client';

/**
 * CommentSection.tsx
 * Shows comment list (with threaded replies depth ≤ 2) and comment form.
 * Features:
 *  - Optimistic append on submit
 *  - Soft-deleted comment display ("[Komentar telah dihapus]")
 *  - Reply support (1 level shown)
 *  - Owner/admin can delete
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getComments, addComment, deleteComment } from '@/lib/postService';
import { useUserProfile } from '@/store/UserProfileProvider';
import type { PostComment } from '@/lib/types';
import { Loader2, Send, Trash2, CornerDownRight } from 'lucide-react';

interface CommentSectionProps {
    postId: string;
    onCountChange?: (newCount: number) => void;
}

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
}

function formatDate(ts: any) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface CommentItemProps {
    comment: PostComment;
    depth: number;
    currentUid: string | null;
    currentRole: string | null;
    onReply: (commentId: string, authorName: string) => void;
    onDelete: (commentId: string) => void;
    isDeleting: string | null;
}

function CommentItem({ comment, depth, currentUid, currentRole, onReply, onDelete, isDeleting }: CommentItemProps) {
    const isOwner = currentUid === comment.author.uid;
    const isAdmin = currentRole === 'admin';
    const canDelete = (isOwner || isAdmin) && !comment.is_deleted;

    return (
        <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
            {depth > 0 && <CornerDownRight className="h-4 w-4 text-slate-300 mt-2 shrink-0" />}
            {/* Avatar */}
            {comment.author?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={comment.author.photo_url}
                    alt={comment.author.display_name}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                    loading="lazy"
                />
            ) : (
                <div className="h-8 w-8 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {getInitials(comment.author?.display_name ?? 'U')}
                </div>
            )}
            <div className="flex-1 min-w-0">
                {/* Name + date */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{comment.author?.display_name}</span>
                    {comment.author?.role === 'admin' && (
                        <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDate(comment.created_at)}</span>
                </div>
                {/* Body */}
                <p className={`text-sm mt-1 leading-relaxed ${comment.is_deleted ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                    {comment.body}
                </p>
                {/* Actions */}
                {!comment.is_deleted && (
                    <div className="flex items-center gap-3 mt-1.5">
                        {depth < 2 && (
                            <button
                                type="button"
                                onClick={() => onReply(comment.id!, comment.author.display_name)}
                                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Balas
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(comment.id!)}
                                disabled={isDeleting === comment.id}
                                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                            >
                                {isDeleting === comment.id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Trash2 className="h-3 w-3" />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CommentSection({ postId, onCountChange }: CommentSectionProps) {
    const { profile, uid } = useUserProfile();
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Build threaded tree (flat → nested display by grouping)
    const topLevel = comments.filter((c) => !c.parent_comment_id);
    const repliesFor = (parentId: string) => comments.filter((c) => c.parent_comment_id === parentId);

    // Load comments
    useEffect(() => {
        setIsFetching(true);
        getComments(postId)
            .then((r) => {
                setComments(r.comments);
                setNextCursor(r.nextCursor);
                setHasMore(r.hasMore);
            })
            .catch(console.error)
            .finally(() => setIsFetching(false));
    }, [postId]);

    const loadMore = async () => {
        if (!nextCursor || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const r = await getComments(postId, nextCursor);
            setComments((prev) => [...prev, ...r.comments]);
            setNextCursor(r.nextCursor);
            setHasMore(r.hasMore);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleReply = useCallback((commentId: string, name: string) => {
        setReplyTo({ id: commentId, name });
        inputRef.current?.focus();
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || isSubmitting) return;
        if (!uid) {
            alert('Login terlebih dahulu untuk berkomentar');
            return;
        }

        setIsSubmitting(true);
        try {
            const newComment = await addComment(postId, body.trim(), replyTo?.id);
            // Optimistic prepend / append
            setComments((prev) => {
                if (newComment.parent_comment_id) {
                    return [...prev, newComment];
                }
                return [newComment, ...prev];
            });
            onCountChange?.(comments.length + 1);
            setBody('');
            setReplyTo(null);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Gagal mengirim komentar');
        } finally {
            setIsSubmitting(false);
        }
    }, [body, isSubmitting, uid, postId, replyTo, comments.length, onCountChange]);

    const handleDelete = useCallback(async (commentId: string) => {
        if (!confirm('Hapus komentar ini?')) return;
        setDeletingId(commentId);
        try {
            await deleteComment(postId, commentId);
            // Soft-delete optimistic update
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? { ...c, is_deleted: true, body: '[Komentar telah dihapus]' }
                        : c
                )
            );
        } catch {
            alert('Gagal menghapus komentar');
        } finally {
            setDeletingId(null);
        }
    }, [postId]);

    return (
        <section className="mt-10 pt-8 border-t border-slate-100">
            <h2 className="text-base font-black text-slate-900 mb-5">
                Komentar ({comments.filter((c) => !c.parent_comment_id).length})
            </h2>

            {/* Comment form */}
            {uid ? (
                <form onSubmit={handleSubmit} className="mb-6 space-y-2">
                    {replyTo && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600 font-bold">
                            <CornerDownRight className="h-3.5 w-3.5" />
                            Membalas {replyTo.name}
                            <button type="button" onClick={() => setReplyTo(null)} className="ml-auto hover:text-red-800">✕</button>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-1">
                            {getInitials(profile?.displayName ?? uid ?? 'U')}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={replyTo ? `Balas ${replyTo.name}…` : 'Tulis komentar…'}
                                maxLength={2000}
                                rows={2}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12
                                           text-sm text-slate-800 placeholder:text-slate-400 resize-none
                                           outline-none focus:border-red-400 focus:ring-4 focus:ring-red-200/30 transition-all"
                                disabled={isSubmitting}
                            />
                            <button
                                type="submit"
                                disabled={!body.trim() || isSubmitting}
                                className="absolute right-3 bottom-3 rounded-xl p-1.5 bg-red-600
                                           text-white transition-all hover:bg-red-700 disabled:opacity-40
                                           flex items-center justify-center"
                                aria-label="Kirim komentar"
                            >
                                {isSubmitting
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <p className="mb-6 text-sm text-slate-500 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
                    <a href="/login" className="font-bold text-red-600 hover:underline">Login</a> untuk berkomentar.
                </p>
            )}

            {/* Comment list */}
            {isFetching ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-slate-200 rounded" />
                                <div className="h-3 w-full bg-slate-100 rounded" />
                                <div className="h-3 w-3/4 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada komentar. Jadilah yang pertama!</p>
            ) : (
                <div className="space-y-5">
                    {topLevel.map((comment) => (
                        <div key={comment.id}>
                            <CommentItem
                                comment={comment}
                                depth={0}
                                currentUid={uid}
                                currentRole={profile?.role ?? null}
                                onReply={handleReply}
                                onDelete={handleDelete}
                                isDeleting={deletingId}
                            />
                            {/* Replies (depth 1) */}
                            <div className="mt-3 space-y-3">
                                {repliesFor(comment.id!).map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        depth={1}
                                        currentUid={uid}
                                        currentRole={profile?.role ?? null}
                                        onReply={handleReply}
                                        onDelete={handleDelete}
                                        isDeleting={deletingId}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Load more */}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-bold
                                       text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Muat komentar lainnya'}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
