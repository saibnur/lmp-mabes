'use client';

import { useVerification } from '@/viewmodels/useVerification';
import VerificationTable from '@/components/verification/VerificationTable';
import { RefreshCw } from 'lucide-react';

export default function VerificationPage() {
    const { duplicates, isLoading, refetch } = useVerification();

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Verifikasi KTP</h1>
                    <p className="text-sm text-text-muted">
                        Deteksi duplikasi NIK dan indikasi pemalsuan identitas
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 rounded-xl border border-border-custom px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-hover hover:text-white"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            {!isLoading && duplicates.length > 0 && (
                <div className="glass-card flex items-center gap-3 border-l-4 border-l-danger p-4">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-sm font-semibold text-white">
                            Ditemukan {duplicates.length} NIK dengan duplikasi
                        </p>
                        <p className="text-xs text-text-muted">
                            Periksa dan verifikasi manual setiap kasus di bawah ini
                        </p>
                    </div>
                </div>
            )}

            <VerificationTable duplicates={duplicates} isLoading={isLoading} />
        </div>
    );
}
