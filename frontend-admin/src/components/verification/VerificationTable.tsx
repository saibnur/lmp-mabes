import React from 'react';
import type { NikCheckResult } from '@/models/member.types';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VerificationTableProps {
    duplicates: NikCheckResult[];
    isLoading: boolean;
}

export default function VerificationTable({ duplicates, isLoading }: VerificationTableProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-custom bg-surface-base">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-text-muted">Memuat data verifikasi...</p>
            </div>
        );
    }

    if (!duplicates || duplicates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border-custom bg-surface-base">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Semua Aman</h3>
                <p className="text-sm text-text-muted">Tidak ditemukan indikasi duplikasi NIK.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border-custom bg-surface-base shadow-lg overflow-hidden">
            {/* ── Mobile: card-based layout (< md) ── */}
            <div className="md:hidden divide-y divide-border-custom">
                {duplicates.map((item, index) => (
                    <div key={item.nik + index} className="p-4 space-y-3">
                        {/* NIK + badge */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Nomor NIK</p>
                                <span className="font-semibold text-white tracking-wide font-mono text-sm">{item.nik}</span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger shrink-0">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Duplikat ({item.matchingMembers.length})
                            </span>
                        </div>

                        {/* Member list */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Akun Terdaftar</p>
                            <div className="flex flex-col gap-2">
                                {item.matchingMembers.map((member) => (
                                    <div key={member.uid} className="flex flex-col rounded-lg bg-surface-hover/50 p-3 border border-border-custom/30">
                                        <span className="font-semibold text-white text-sm">{member.displayName || 'Tanpa Nama'}</span>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-1">
                                            <span className="text-text-muted">Hp: {member.phoneNumber}</span>
                                            <span className="text-text-muted">KTA: {member.no_kta || '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action */}
                        <button
                            type="button"
                            className="w-full flex items-center justify-center rounded-lg bg-surface-hover px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-surface-hover/80 border border-border-custom/50 shadow-sm active:scale-[0.98]"
                            onClick={() => alert(`Tinjau kasus NIK ${item.nik}`)}
                        >
                            Tinjau Kasus
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Desktop: table layout (≥ md) ── */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-text-muted">
                    <thead className="border-b border-border-custom bg-surface-hover text-xs uppercase text-white font-medium">
                        <tr>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap">Nomor NIK</th>
                            <th scope="col" className="px-6 py-4">Akun Terdaftar</th>
                            <th scope="col" className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                            <th scope="col" className="px-6 py-4 text-center whitespace-nowrap">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom bg-surface-base">
                        {duplicates.map((item, index) => (
                            <tr key={item.nik + index} className="transition-colors hover:bg-surface-hover/30">
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className="font-semibold text-white tracking-wide font-mono">{item.nik}</span>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="flex flex-col gap-3">
                                        {item.matchingMembers.map((member) => (
                                            <div key={member.uid} className="flex flex-col rounded-lg bg-surface-hover/50 p-3 border border-border-custom/30">
                                                <span className="font-semibold text-white truncate max-w-[200px]">
                                                    {member.displayName || 'Tanpa Nama'}
                                                </span>
                                                <div className="flex gap-2 text-xs mt-1 flex-wrap">
                                                    <span className="text-text-muted">Hp: {member.phoneNumber}</span>
                                                    <span className="text-text-muted/50">•</span>
                                                    <span className="text-text-muted">KTA: {member.no_kta || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Duplikat ({item.matchingMembers.length})
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-lg bg-surface-hover px-4 py-2 text-sm font-medium text-white transition-all hover:bg-surface-hover/80 hover:scale-[1.02] border border-border-custom/50 shadow-sm"
                                        onClick={() => alert(`Tinjau kasus NIK ${item.nik}`)}
                                    >
                                        Tinjau
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}