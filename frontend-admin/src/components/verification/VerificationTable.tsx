'use client';

import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import type { NikCheckResult } from '@/models/member.types';

interface VerificationTableProps {
    duplicates: NikCheckResult[];
    isLoading: boolean;
}

export default function VerificationTable({ duplicates, isLoading }: VerificationTableProps) {
    if (isLoading) {
        return (
            <div className="glass-card flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
            </div>
        );
    }

    if (duplicates.length === 0) {
        return (
            <div className="glass-card flex h-64 flex-col items-center justify-center gap-3 text-center">
                <CheckCircle className="h-12 w-12 text-success/50" />
                <div>
                    <p className="font-medium text-white">Tidak ada duplikasi NIK</p>
                    <p className="text-sm text-text-muted">Semua NIK member unik dan terverifikasi</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {duplicates.map((dup) => (
                <div key={dup.nik} className="glass-card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-border-custom bg-danger/5 px-4 py-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-danger" />
                        <div>
                            <p className="text-sm font-semibold text-white">
                                NIK Duplikat: <span className="font-mono text-danger">{dup.nik}</span>
                            </p>
                            <p className="text-xs text-text-muted">
                                Ditemukan {dup.matchingMembers.length} member dengan NIK yang sama
                            </p>
                        </div>
                    </div>

                    {/* Members list */}
                    <div className="divide-y divide-border-custom/50">
                        {dup.matchingMembers.map((m: any) => (
                            <div
                                key={m.uid}
                                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-hover/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">
                                        {(m.displayName || '?')[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{m.displayName || '-'}</p>
                                        <p className="text-xs text-text-muted">
                                            {m.phoneNumber || '-'} • KTA: {m.no_kta || '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {m.membershipStatus && (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                      ${m.membershipStatus === 'active'
                                                ? 'bg-success/15 text-success'
                                                : 'bg-warning/15 text-warning'
                                            }`}
                                        >
                                            {m.membershipStatus}
                                        </span>
                                    )}
                                    {m.ktpURL && (
                                        <a
                                            href={m.ktpURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-lg p-2 text-text-muted hover:bg-brand/10 hover:text-brand-light"
                                            title="Lihat KTP"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
