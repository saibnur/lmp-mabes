'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Clock, RefreshCw, Loader2,
    ExternalLink, ChevronDown, AlertCircle, Building2,
    Search, X
} from 'lucide-react';
import { adminPaymentService, PaymentConfirmation } from '@/services/adminPaymentService';

interface Props {
    idToken: string;
}

const STATUS_FILTER_OPTIONS = [
    { value: 'submitted', label: 'Menunggu Verif', color: 'amber' },
    { value: 'approved', label: 'Disetujui', color: 'green' },
    { value: 'rejected', label: 'Ditolak', color: 'red' },
    { value: '', label: 'Semua', color: 'slate' },
];

function StatusBadge({ status }: { status: PaymentConfirmation['status'] }) {
    const map = {
        pending: { label: 'Menunggu Konfirmasi', cls: 'bg-slate-100 text-slate-600' },
        submitted: { label: 'Menunggu Verifikasi', cls: 'bg-amber-100 text-amber-700' },
        approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
        rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
    };
    const { label, cls } = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            {label}
        </span>
    );
}

// ─── Modal: Konfirmasi Approve ──────────────────────────────────────────────
function ApproveModal({
    open,
    onConfirm,
    onCancel,
    loading,
}: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">Setujui Pembayaran?</p>
                        <p className="text-sm text-slate-500">Keanggotaan user akan langsung diaktifkan.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Ya, Setujui
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Modal: Reject dengan Alasan ───────────────────────────────────────────
function RejectModal({
    open,
    reason,
    onChangeReason,
    onConfirm,
    onCancel,
    loading,
}: {
    open: boolean;
    reason: string;
    onChangeReason: (v: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">Tolak Pembayaran?</p>
                        <p className="text-sm text-slate-500">Masukkan alasan penolakan (wajib).</p>
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={reason}
                    onChange={(e) => onChangeReason(e.target.value)}
                    placeholder="Alasan penolakan..."
                    className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading || !reason.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Konfirmasi Tolak
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function PembayaranManualPage({ idToken }: Props) {
    const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Approve modal
    const [approveTarget, setApproveTarget] = useState<string | null>(null);
    // Reject modal
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminPaymentService.getPendingPayments(
                idToken,
                statusFilter || undefined
            );
            setConfirmations(data);
            // Update pendingCount dari data jika filter semua
            if (!statusFilter) {
                setPendingCount(data.filter((d) => d.status === 'submitted').length);
            } else if (statusFilter === 'submitted') {
                setPendingCount(data.length);
            }
        } catch {
            showToast('Gagal memuat data pembayaran.', 'error');
        } finally {
            setLoading(false);
        }
    }, [idToken, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter client-side by search
    const displayed = searchQuery.trim()
        ? confirmations.filter((c) => {
            const q = searchQuery.toLowerCase();
            return (
                (c.customerDetails?.name || '').toLowerCase().includes(q) ||
                (c.customerDetails?.email || '').toLowerCase().includes(q)
            );
        })
        : confirmations;

    const handleApprove = async () => {
        if (!approveTarget) return;
        setActionLoading(approveTarget + '-approve');
        try {
            await adminPaymentService.approvePayment(idToken, approveTarget);
            showToast('Pembayaran disetujui. Keanggotaan user diaktifkan.', 'success');
            setApproveTarget(null);
            await fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Gagal menyetujui pembayaran.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) { showToast('Masukkan alasan penolakan.', 'error'); return; }
        setActionLoading(rejectTarget + '-reject');
        try {
            await adminPaymentService.rejectPayment(idToken, rejectTarget, rejectReason.trim());
            showToast('Pembayaran ditolak.', 'success');
            setRejectTarget(null);
            setRejectReason('');
            await fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Gagal menolak pembayaran.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modals */}
            <ApproveModal
                open={!!approveTarget}
                onConfirm={handleApprove}
                onCancel={() => setApproveTarget(null)}
                loading={!!actionLoading}
            />
            <RejectModal
                open={!!rejectTarget}
                reason={rejectReason}
                onChangeReason={setRejectReason}
                onConfirm={handleRejectConfirm}
                onCancel={() => { setRejectTarget(null); setRejectReason(''); }}
                loading={!!actionLoading}
            />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-red-600" />
                                Pembayaran Manual
                                {pendingCount > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black">
                                        {pendingCount > 99 ? '99+' : pendingCount}
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Verifikasi konfirmasi transfer bank dari member
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 mt-4 overflow-x-auto">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                                statusFilter === opt.value
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Search bar */}
                <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 bg-gray-50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-5xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Tidak ada data pembayaran</p>
                        <p className="text-sm mt-1">
                            {searchQuery
                                ? `Tidak ada hasil untuk "${searchQuery}".`
                                : statusFilter === 'submitted'
                                    ? 'Belum ada konfirmasi pembayaran baru.'
                                    : 'Tidak ada data untuk filter ini.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                            {displayed.length} pembayaran ditemukan
                        </p>
                        {displayed.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition"
                            >
                                {/* Row Summary */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {item.customerDetails?.name || item.uid.slice(0, 8)}
                                            </p>
                                            <StatusBadge status={item.status} />
                                            {item.uniqueCode && (
                                                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    Kode: {String(item.uniqueCode).padStart(3, '0')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                            {item.customerDetails?.email && (
                                                <span>{item.customerDetails.email}</span>
                                            )}
                                            <span>Rp {(item.grossAmount || 0).toLocaleString('id-ID')}</span>
                                            {item.confirmation?.submittedAt && (
                                                <span>{new Date(item.confirmation.submittedAt).toLocaleDateString('id-ID')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.status === 'submitted' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setApproveTarget(item.orderId); }}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setRejectTarget(item.orderId); }}
                                                    disabled={!!actionLoading}
                                                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Tolak
                                                </button>
                                            </>
                                        )}
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                <AnimatePresence>
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                                                {/* Detail grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Nama</p>
                                                        <p className="text-gray-800 font-medium">{item.customerDetails?.name || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Email</p>
                                                        <p className="text-gray-800 font-medium break-all">{item.customerDetails?.email || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Kode Unik</p>
                                                        <p className="font-mono font-bold text-red-700 text-lg">{item.uniqueCode ? String(item.uniqueCode).padStart(3, '0') : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Total Transfer</p>
                                                        <p className="text-red-700 font-bold">Rp {(item.grossAmount || 0).toLocaleString('id-ID')}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">ID Order</p>
                                                        <p className="font-mono text-xs text-gray-600">{item.orderId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Konfirmasi</p>
                                                        <p className="text-gray-600 text-xs">
                                                            {item.confirmation?.submittedAt
                                                                ? new Date(item.confirmation.submittedAt).toLocaleString('id-ID')
                                                                : 'Belum dikonfirmasi'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Bukti transfer */}
                                                <div>
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-2">Bukti Transfer</p>
                                                    {item.confirmation?.buktiUrl ? (
                                                        <a
                                                            href={item.confirmation.buktiUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-block"
                                                        >
                                                            <img
                                                                src={item.confirmation.buktiUrl}
                                                                alt="Bukti Transfer"
                                                                className="max-h-48 rounded-xl border border-gray-200 object-contain hover:opacity-90 transition"
                                                            />
                                                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                                                <ExternalLink className="w-3 h-3" /> Buka di tab baru
                                                            </p>
                                                        </a>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic">Tidak ada foto</p>
                                                    )}
                                                </div>

                                                {/* Admin note */}
                                                {item.adminNote && (
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Catatan Admin</p>
                                                        <p className="text-gray-700 text-sm">{item.adminNote}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl flex items-center gap-2 ${
                            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <AlertCircle className="w-4 h-4" />
                        }
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
