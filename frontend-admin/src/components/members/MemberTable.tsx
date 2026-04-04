'use client';

import { useState, useRef, useCallback } from 'react';
import { Pencil, ChevronLeft, ChevronRight, ChevronDown, Users, IdCard, GripVertical } from 'lucide-react';
import type { Member } from '@/models/member.types';

interface MemberTableProps {
    members: Member[];
    totalMembers: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (member: Member) => void;
    onPreview: (member: Member) => void;
    isLoading?: boolean;
}

interface ColDef {
    key: string;
    label: string;
    defaultWidth: number;
    minWidth: number;
    className?: string;
}

const COLUMNS: ColDef[] = [
    { key: 'member', label: 'Member', defaultWidth: 220, minWidth: 160 },
    { key: 'provinsi', label: 'Provinsi', defaultWidth: 140, minWidth: 100, className: 'hidden lg:table-cell' },
    { key: 'kota', label: 'Kab/Kota', defaultWidth: 160, minWidth: 100, className: 'hidden lg:table-cell' },
    { key: 'kec', label: 'Kec.', defaultWidth: 140, minWidth: 100, className: 'hidden xl:table-cell' },
    { key: 'desa', label: 'Kel/Desa', defaultWidth: 140, minWidth: 100, className: 'hidden xl:table-cell' },
    { key: 'kta', label: 'No. KTA', defaultWidth: 150, minWidth: 120 },
    { key: 'jabatan', label: 'Jabatan', defaultWidth: 120, minWidth: 90, className: 'hidden lg:table-cell' },
    { key: 'status', label: 'Status', defaultWidth: 100, minWidth: 80 },
    { key: 'role', label: 'Role', defaultWidth: 90, minWidth: 70 },
    { key: 'aksi', label: 'Aksi', defaultWidth: 80, minWidth: 70 },
];

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Aktif' },
        pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' },
        expired: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Expired' },
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

function JabatanBadge({ jabatan }: { jabatan?: string }) {
    if (!jabatan) return <span className="text-text-muted/40 text-xs">—</span>;
    return (
        <span className="inline-flex items-center rounded-lg bg-surface-hover
                         px-2 py-0.5 text-[10px] font-bold text-text-muted uppercase tracking-wide">
            {jabatan.toUpperCase()}
        </span>
    );
}

function Avatar({ member }: { member: Member }) {
    const initials = (member.displayName || '?')[0]?.toUpperCase();
    return member.photoURL ? (
        <img src={member.photoURL} alt="" className="h-9 w-9 rounded-full object-cover border border-border-custom shrink-0" />
    ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/5 text-xs font-bold text-brand-primary border border-brand/10">
            {initials}
        </div>
    );
}

function ResizeHandle({ onResize }: { onResize: (dx: number) => void }) {
    const startX = useRef<number>(0);
    const isDragging = useRef(false);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        startX.current = e.clientX;
        isDragging.current = true;

        const onMouseMove = (ev: MouseEvent) => {
            if (!isDragging.current) return;
            onResize(ev.clientX - startX.current);
            startX.current = ev.clientX;
        };
        const onMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [onResize]);

    return (
        <div
            onMouseDown={onMouseDown}
            className="absolute right-0 top-0 h-full w-4 flex items-center justify-center
                       cursor-col-resize group z-10 select-none"
            title="Tarik untuk mengubah lebar kolom"
        >
            <div className="h-5 w-px bg-border-custom group-hover:bg-red-500 group-hover:w-0.5
                            transition-all duration-150 rounded-full" />
            <GripVertical className="absolute h-3 w-3 text-transparent group-hover:text-red-500
                                     transition-colors duration-150" />
        </div>
    );
}

function MobileSkeletonCard() {
    return (
        <div className="glass-card p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-surface-hover shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-4 w-2/3 rounded-lg bg-surface-hover" />
                    <div className="h-3 w-1/2 rounded-lg bg-surface-hover" />
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="h-5 w-14 rounded-full bg-surface-hover" />
                    <div className="h-4 w-12 rounded-full bg-surface-hover" />
                </div>
            </div>
            <div className="flex items-center justify-between pt-1">
                <div className="space-y-1.5">
                    <div className="h-2.5 w-12 rounded bg-surface-hover" />
                    <div className="h-3.5 w-28 rounded bg-surface-hover" />
                </div>
                <div className="flex gap-1.5">
                    <div className="h-7 w-16 rounded-lg bg-surface-hover" />
                    <div className="h-7 w-14 rounded-lg bg-surface-hover" />
                    <div className="h-7 w-14 rounded-lg bg-surface-hover" />
                </div>
            </div>
        </div>
    );
}

function SkeletonRow({ widths }: { widths: number[] }) {
    return (
        <tr className="border-b border-border-custom/30">
            <td className="px-4 py-3.5" style={{ width: widths[0] }}>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-surface-hover animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 w-3/4 rounded-lg bg-surface-hover animate-pulse" />
                        <div className="h-3 w-1/2 rounded-lg bg-surface-hover animate-pulse" />
                    </div>
                </div>
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell" style={{ width: widths[1] }}>
                <div className="h-4 rounded-lg bg-surface-hover animate-pulse w-4/5" />
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell" style={{ width: widths[2] }}>
                <div className="h-4 rounded-lg bg-surface-hover animate-pulse w-4/5" />
            </td>
            <td className="px-4 py-3.5 hidden xl:table-cell" style={{ width: widths[3] }}>
                <div className="h-4 rounded-lg bg-surface-hover animate-pulse w-3/4" />
            </td>
            <td className="px-4 py-3.5 hidden xl:table-cell" style={{ width: widths[4] }}>
                <div className="h-4 rounded-lg bg-surface-hover animate-pulse w-3/4" />
            </td>
            <td className="px-4 py-3.5" style={{ width: widths[5] }}>
                <div className="h-4 rounded-lg bg-surface-hover animate-pulse w-5/6" />
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell" style={{ width: widths[6] }}>
                <div className="h-5 w-16 rounded-lg bg-surface-hover animate-pulse" />
            </td>
            <td className="px-4 py-3.5" style={{ width: widths[7] }}>
                <div className="h-6 w-16 rounded-full bg-surface-hover animate-pulse" />
            </td>
            <td className="px-4 py-3.5" style={{ width: widths[8] }}>
                <div className="h-5 w-14 rounded-full bg-surface-hover animate-pulse" />
            </td>
            <td className="px-4 py-3.5" style={{ width: widths[9] }}>
                <div className="flex gap-1">
                    <div className="h-8 w-8 rounded-xl bg-surface-hover animate-pulse" />
                    <div className="h-8 w-8 rounded-xl bg-surface-hover animate-pulse" />
                </div>
            </td>
        </tr>
    );
}

function MemberCard({
    member,
    onEdit,
    onPreview,
}: {
    member: Member;
    onEdit: (m: Member) => void;
    onPreview: (m: Member) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const canEdit = member.membershipStatus === 'active';

    return (
        <div className="glass-card p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 min-w-0">
                <Avatar member={member} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate text-sm">{member.displayName || '-'}</p>
                    <p className="text-xs text-text-muted truncate">{member.phoneNumber || member.phone || '-'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={member.membershipStatus} />
                    <RoleBadge role={member.role} />
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="min-w-0">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">No. KTA</p>
                    <p className="font-mono text-xs text-foreground/80 mt-0.5">{member.no_kta || '-'}</p>
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="flex items-center gap-1 rounded-lg border border-border-custom bg-surface-hover px-2.5 py-1.5 text-xs font-bold text-text-muted hover:text-foreground transition-all"
                    >
                        Detail
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={() => onEdit(member)}
                        disabled={!canEdit}
                        className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-all"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </button>
                    <button
                        onClick={() => onPreview(member)}
                        className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition-all"
                    >
                        <IdCard className="h-3.5 w-3.5" />
                        KTA
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="pt-3 border-t border-border-custom grid grid-cols-2 gap-x-4 gap-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {[
                        { label: 'EMAIL', value: member.email },
                        { label: 'PROVINSI', value: member.organization?.province_name },
                        { label: 'KAB/KOTA', value: member.organization?.regency_name },
                        { label: 'KECAMATAN', value: member.organization?.district_name },
                        { label: 'KEL/DESA', value: member.organization?.village_name },
                        { label: 'JABATAN', value: member.kepengurusan?.jabatan?.toUpperCase() },
                        { label: 'NIK', value: member.nik ? `${member.nik.slice(0, 6)}...` : '-' },
                    ].map(({ label, value }) => (
                        <div key={label} className="min-w-0">
                            <p className="text-[9px] text-text-muted font-black tracking-widest">{label}</p>
                            <p className="text-xs text-foreground font-medium mt-0.5 truncate">{value || '-'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MemberTable({
    members,
    totalMembers,
    page,
    totalPages,
    onPageChange,
    onEdit,
    onPreview,
    isLoading,
}: MemberTableProps) {
    const pageSize = 10;
    const [colWidths, setColWidths] = useState<number[]>(COLUMNS.map(c => c.defaultWidth));

    const handleResize = useCallback((colIndex: number, dx: number) => {
        setColWidths(prev => {
            const next = [...prev];
            next[colIndex] = Math.max(COLUMNS[colIndex].minWidth, next[colIndex] + dx);
            return next;
        });
    }, []);

    const totalWidth = colWidths.reduce((a, b) => a + b, 0);

    const Pagination = () => (
        totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-custom px-4 py-4 bg-surface-hover/30">
                <p className="text-xs font-medium text-text-muted">
                    <span className="text-foreground font-bold">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalMembers)}</span>
                    {' '}dari{' '}
                    <span className="text-foreground font-bold">{totalMembers}</span>
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                        const p = start + i;
                        if (p > totalPages) return null;
                        return (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`h-8 w-8 rounded-xl text-xs font-bold transition-all
                                    ${p === page
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
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
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        ) : null
    );

    if (isLoading) {
        return (
            <>
                <div className="md:hidden space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <MobileSkeletonCard key={i} />)}
                </div>
                <div className="glass-card shadow-sm border border-border-custom overflow-hidden hidden md:block bg-surface w-full min-w-0">
                    <div className="overflow-x-auto">
                        <table className="text-left text-sm" style={{ tableLayout: 'fixed', width: totalWidth }}>
                            <thead>
                                <tr className="border-b border-border-custom bg-surface-hover/30">
                                    {COLUMNS.map((col, i) => (
                                        <th
                                            key={col.key}
                                            style={{ width: colWidths[i] }}
                                            className={`relative px-4 py-4 ${col.className || ''}`}
                                        >
                                            <div className="h-3 w-16 rounded bg-surface-hover animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-custom/50 bg-surface">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonRow key={i} widths={colWidths} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* ── Mobile ── */}
            <div className="md:hidden space-y-3">
                {members.length === 0 ? (
                    <div className="glass-card py-20 text-center text-sm text-text-muted flex flex-col items-center gap-3">
                        <Users className="h-10 w-10 opacity-20" />
                        Belum ada member ditemukan
                    </div>
                ) : (
                    members.map((m) => (
                        <MemberCard
                            key={m.uid}
                            member={m}
                            onEdit={onEdit}
                            onPreview={onPreview}
                        />
                    ))
                )}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="flex items-center gap-1 rounded-xl bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-muted hover:text-foreground disabled:opacity-30 shadow-sm transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </button>
                        <span className="text-xs font-bold text-foreground">{page} / {totalPages}</span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded-xl bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-muted hover:text-foreground disabled:opacity-30 shadow-sm transition-all"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Desktop ── */}
            <div className="glass-card shadow-sm border border-border-custom overflow-hidden hidden md:block bg-surface w-full min-w-0">
                <div className="overflow-x-auto">
                    <table className="text-left text-sm" style={{ tableLayout: 'fixed', width: totalWidth }}>
                        <thead>
                            <tr className="border-b border-border-custom bg-surface-hover/30">
                                {COLUMNS.map((col, i) => (
                                    <th
                                        key={col.key}
                                        style={{ width: colWidths[i] }}
                                        className={`relative px-4 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted/70 select-none ${col.className || ''}`}
                                    >
                                        {col.label}
                                        {i < COLUMNS.length - 1 && (
                                            <ResizeHandle onResize={(dx) => handleResize(i, dx)} />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom/50">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="py-24 text-center text-sm text-text-muted">
                                        Tidak ada member ditemukan
                                    </td>
                                </tr>
                            ) : (
                                members.map((m) => (
                                    <tr key={m.uid} className="transition-colors hover:bg-surface-hover/40">
                                        {/* Member */}
                                        <td className="px-4 py-3.5" style={{ width: colWidths[0] }}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar member={m} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-foreground">{m.displayName || '-'}</p>
                                                    <p className="truncate text-xs text-text-muted font-medium">{m.phoneNumber || m.phone || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Provinsi */}
                                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium hidden lg:table-cell" style={{ width: colWidths[1] }}>
                                            <span className="truncate block">{m.organization?.province_name || '-'}</span>
                                        </td>
                                        {/* Kab/Kota */}
                                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium hidden lg:table-cell" style={{ width: colWidths[2] }}>
                                            <span className="truncate block">{m.organization?.regency_name || '-'}</span>
                                        </td>
                                        {/* Kecamatan */}
                                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium hidden xl:table-cell" style={{ width: colWidths[3] }}>
                                            <span className="truncate block">{m.organization?.district_name || '-'}</span>
                                        </td>
                                        {/* Kel/Desa */}
                                        <td className="px-4 py-3.5 text-sm text-text-muted font-medium hidden xl:table-cell" style={{ width: colWidths[4] }}>
                                            <span className="truncate block">{m.organization?.village_name || '-'}</span>
                                        </td>
                                        {/* No. KTA */}
                                        <td className="px-4 py-3.5 font-mono text-xs text-text-muted/80 whitespace-nowrap" style={{ width: colWidths[5] }}>
                                            {m.no_kta || '-'}
                                        </td>
                                        {/* Jabatan */}
                                        <td className="px-4 py-3.5 hidden lg:table-cell" style={{ width: colWidths[6] }}>
                                            <JabatanBadge jabatan={m.kepengurusan?.jabatan} />
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3.5 whitespace-nowrap" style={{ width: colWidths[7] }}>
                                            <StatusBadge status={m.membershipStatus} />
                                        </td>
                                        {/* Role */}
                                        <td className="px-4 py-3.5 whitespace-nowrap" style={{ width: colWidths[8] }}>
                                            <RoleBadge role={m.role} />
                                        </td>
                                        {/* Aksi */}
                                        <td className="px-4 py-3.5" style={{ width: colWidths[9] }}>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(m)}
                                                    disabled={m.membershipStatus !== 'active'}
                                                    className="rounded-xl p-2 text-text-muted transition-all hover:bg-slate-900 hover:text-white disabled:opacity-20"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onPreview(m)}
                                                    className="rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                    title="Lihat KTA"
                                                >
                                                    <IdCard className="h-4 w-4" />
                                                </button>
                                            </div>
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