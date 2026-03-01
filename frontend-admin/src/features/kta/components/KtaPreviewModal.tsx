// components/kta/KtaPreviewModal.tsx
'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import KtaCard from '@/features/kta/components/KtaCard';
import { KtaCardConfig } from '@/features/kta/types/KtaCardConfig';
import type { Member } from '@/models/member.types';

interface KtaPreviewModalProps {
    member: Member | null;
    ktaConfig: KtaCardConfig;
    onClose: () => void;
}

export default function KtaPreviewModal({ member, ktaConfig, onClose }: KtaPreviewModalProps) {
    return (
        <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md bg-white p-0 overflow-hidden border-2 border-slate-200 shadow-2xl rounded-3xl gap-0">
                <DialogTitle className="sr-only">Preview KTA</DialogTitle>

                {/* Header dengan tombol Tutup */}
                <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 p-4 border-t-4 border-t-red-600">
                    <span className="font-bold text-slate-900">Preview KTA Digital</span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Container KTA dengan scroll horizontal untuk mobile */}
                <div className="flex justify-start sm:justify-center p-4 sm:p-6 bg-slate-100/50 overflow-x-auto overflow-y-hidden custom-scrollbar">
                    {member && (() => {
                        const levelMapping: Record<string, any> = {
                            'pusat': 'pusat',
                            'provinsi': 'daerah',
                            'kab_kota': 'cabang',
                            'kecamatan': 'anak-cabang',
                            'kelurahan': 'ranting'
                        };

                        const mappedLevel = member.kepengurusan?.level
                            ? levelMapping[member.kepengurusan.level]
                            : member.organization?.level;

                        return (
                            <div className="flex-shrink-0 shadow-lg shadow-slate-300/50 rounded-xl overflow-hidden border-2 border-slate-200 bg-white">
                                <KtaCard
                                    config={ktaConfig}
                                    scale={0.4}
                                    photoUrl={member.photoURL || ''}
                                    displayName={member.displayName || 'NAMA MEMBER'}
                                    orgLevel={mappedLevel}
                                    regionNames={{
                                        provinceName: member.organization?.province_name || '',
                                        regencyName: member.organization?.regency_name || '',
                                        districtName: member.organization?.district_name || '',
                                        villageName: member.organization?.village_name || '',
                                    }}
                                    jabatanText={(member.kepengurusan?.jabatan ?? 'ANGGOTA').toUpperCase()}
                                    noKta={member.no_kta}
                                    isActive={member.membershipStatus === 'active'}
                                    expiryDate={
                                        member.membershipExpiry &&
                                            typeof (member.membershipExpiry as any).toDate === 'function'
                                            ? (member.membershipExpiry as any).toDate()
                                            : new Date()
                                    }
                                />
                            </div>
                        );
                    })()}
                </div>

                <div className="p-4 bg-white space-y-3 border-t border-slate-100">
                    <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        KTA Preview (Admin Mode)
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-colors uppercase tracking-tight"
                    >
                        Tutup Preview
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
