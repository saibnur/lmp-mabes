// ──────────────────────────────────────────────────────────────────────────────
// Utility functions — LMP Superapp
// ──────────────────────────────────────────────────────────────────────────────

/** Normalisasi nomor Indonesia ke 62xxxxxxxxxx (untuk request ke backend) */
export function normalizePhoneIndonesia(phone: string): string {
    let p = String(phone).replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    if (!p.startsWith('62')) p = '62' + p;
    return p;
}

/** cn — utility for merging classNames (compatible with Shadcn) */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}
