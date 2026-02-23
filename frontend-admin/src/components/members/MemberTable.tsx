'use client';

import { useState } from 'react';
import { Pencil, ChevronLeft, ChevronRight, ChevronDown, Users } from 'lucide-react';
import type { Member } from '@/models/member.types';

interface MemberTableProps {
    members: Member[];
    totalMembers: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (member: Member) => void;
    isLoading?: boolean;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
        expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
    };
    const s = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
            {s.label}
        </span>
    );
}

function RoleBadge({ role }: { role: string }) {
    return role === 'admin' ? (
        <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
            Admin
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-lmp-navy/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Member
        </span>
    );
}

function Avatar({ member }: { member: Member }) {
    const initials = (member.displayName || '?')[0]?.toUpperCase();
    return member.photoURL ? (
        <img src={member.photoURL} alt="" className="h-9 w-9 rounded-full object-cover border border-border-custom" />
    ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/5 text-xs font-bold text-brand-primary border border-brand/10">
            {initials}
        </div>
    );
}

/* ── Mobile card for a single member ── */
function MemberCard({ member, onEdit }: { member: Member; onEdit: (m: Member) => void }) {
    const [expanded, setExpanded] = useState(false);
    const canEdit = member.membershipStatus === 'active';

    return (
        <div className="glass-card p-4 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Top row */}
            <div className="flex items-center gap-3">
                <Avatar member={member} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{member.displayName || '-'}</p>
                    <p className="text-xs text-text-muted truncate">{member.phoneNumber || member.phone || '-'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={member.membershipStatus} />
                    <RoleBadge role={member.role} />
                </div>
            </div>

            {/* KTA row */}
            <div className="flex items-center justify-between pt-1">
                <div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">No. KTA</p>
                    <p className="font-mono text-xs text-foreground/80 mt-0.5">{member.no_kta || '-'}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="flex items-center gap-1 rounded-lg border border-border-custom bg-surface-hover px-3 py-2 text-xs font-bold text-text-muted hover:text-foreground transition-all"
                    >
                        Detail
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={() => onEdit(member)}
                        disabled={!canEdit}
                        className="flex items-center gap-1 rounded-lg bg-brand-primary/10 border border-brand/5 px-3 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-white disabled:opacity-30 disabled:grayscale transition-all"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </button>
                </div>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="pt-4 border-t border-border-custom grid grid-cols-2 gap-x-4 gap-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {[
                        { label: 'EMAIL', value: member.email },
                        { label: 'PROVINSI', value: member.organization?.province_name },
                        { label: 'KAB/KOTA', value: member.organization?.city_name },
                        { label: 'KECAMATAN', value: member.organization?.district_name },
                        { label: 'KEL/DESA', value: member.organization?.village_name },
                        { label: 'NIK', value: member.nik ? `${member.nik.slice(0, 6)}...` : '-' },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-[9px] text-text-muted font-black tracking-widest">{label}</p>
                            <p className="text-xs text-foreground font-medium mt-0.5 truncate">{value || '-'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Skeleton loader ── */
function SkeletonRow() {
    return (
        <tr className="border-b border-border-custom/30">
            {Array.from({ length: 7 }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-4 rounded bg-surface-hover animate-pulse" style={{ width: `${60 + i * 5}%` }} />
                </td>
            ))}
        </tr>
    );
}

export default function MemberTable({
    members,
    totalMembers,
    page,
    totalPages,
    onPageChange,
    onEdit,
    isLoading,
}: MemberTableProps) {
    const pageSize = 10;

    const Pagination = () => (
        totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-border-custom px-4 py-4 bg-surface-hover/30">
                <p className="text-xs font-medium text-text-muted">
                    Menampilkan <span className="text-foreground font-bold">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalMembers)}</span> dari <span className="text-foreground font-bold">{totalMembers}</span>
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                        const p = start + i;
                        if (p > totalPages) return null;
                        return (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`h-9 w-9 rounded-xl text-xs font-bold transition-all
                                    ${p === page
                                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                        : 'text-text-muted hover:bg-surface-hover hover:text-foreground'}`}
                            >
                                {p}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        ) : null
    );

    if (isLoading) {
        return (
            <>
                {/* Mobile skeleton */}
                <div className="md:hidden space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-card p-4 animate-pulse space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-surface-hover" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded bg-surface-hover" />
                                    <div className="h-3 w-1/2 rounded bg-surface-hover" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Desktop skeleton */}
                <div className="glass-card shadow-sm border border-border-custom overflow-hidden hidden md:block">
                    <table className="w-full text-left text-sm">
                        <tbody className="bg-surface">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                    </table>
                </div>
            </>
        );
    }

    return (
        <>
            {/* ── Mobile Card Layout (< md) ── */}
            <div className="md:hidden space-y-4">
                {members.length === 0 ? (
                    <div className="glass-card py-20 text-center text-sm text-text-muted flex flex-col items-center gap-3">
                        <Users className="h-10 w-10 opacity-20" />
                        Belum ada member ditemukan
                    </div>
                ) : (
                    members.map((m) => <MemberCard key={m.uid} member={m} onEdit={onEdit} />)
                )}
                {/* Mobile pagination simplified */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
                            className="flex items-center gap-1 rounded-xl bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-muted hover:text-foreground disabled:opacity-30 shadow-sm transition-all">
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </button>
                        <span className="text-xs font-bold text-foreground">
                            {page} / {totalPages}
                        </span>
                        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded-xl bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-muted hover:text-foreground disabled:opacity-30 shadow-sm transition-all">
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Desktop Table Layout (≥ md) ── */}
            <div className="glass-card shadow-sm border border-border-custom overflow-hidden hidden md:block bg-surface">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border-custom bg-surface-hover/30">
                                {['Member', 'Provinsi', 'Kab/Kota', 'Kec.', 'Kel/Desa', 'No. KTA', 'Status', 'Role', 'Aksi'].map((h, i) => (
                                    <th key={h} className={`whitespace-nowrap px-4 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted/70
                                        ${i > 0 && i < 5 ? ['', 'hidden lg:table-cell', 'hidden lg:table-cell', 'hidden xl:table-cell', 'hidden xl:table-cell'][i - 0] : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom/50">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-24 text-center text-sm text-text-muted">
                                        Tidak ada member ditemukan
                                    </td>
                                </tr>
                            ) : (
                                members.map((m) => (
                                    <tr
                                        key={m.uid}
                                        className="transition-colors hover:bg-surface-hover/40"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar member={m} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-foreground">{m.displayName || '-'}</p>
                                                    <p className="truncate text-xs text-text-muted font-medium">{m.phoneNumber || m.phone || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-text-muted font-medium hidden lg:table-cell">{m.organization?.province_name || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-text-muted font-medium hidden lg:table-cell">{m.organization?.city_name || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-text-muted font-medium hidden xl:table-cell">{m.organization?.district_name || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-text-muted font-medium hidden xl:table-cell">{m.organization?.village_name || '-'}</td>
                                        <td className="px-4 py-4 font-mono text-xs text-text-muted/80">{m.no_kta || '-'}</td>
                                        <td className="px-4 py-4"><StatusBadge status={m.membershipStatus} /></td>
                                        <td className="px-4 py-4"><RoleBadge role={m.role} /></td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => onEdit(m)}
                                                disabled={m.membershipStatus !== 'active'}
                                                className="rounded-xl p-2.5 text-text-muted transition-all hover:bg-brand-primary/10 hover:text-brand-primary disabled:opacity-20"
                                            >
                                                <Pencil className="h-4.5 w-4.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination />
            </div>
        </>
    );
}
