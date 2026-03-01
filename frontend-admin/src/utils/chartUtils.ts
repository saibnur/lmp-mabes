// /**
//  * chartUtils.ts
//  *
//  * Fungsi utilitas untuk memproses data mentah member dari database
//  * menjadi format yang siap dibaca Recharts:
//  *   [{ label: string, active: number, pending: number }]
//  *
//  * Asumsi data mentah dari Firestore:
//  *   { createdAt: Timestamp | Date | string, membershipStatus: 'active' | 'pending' | 'expired' }
//  */

// import type { TimeRange, MemberChartEntry } from '@/models/member.types';

// export interface ChartPoint {
//     label: string;   // sumbu X
//     active: number;
//     pending: number;
// }

// /**
//  * Alias untuk backward compat — gunakan MemberChartEntry dari member.types.
//  * @deprecated Impor langsung MemberChartEntry dari '@/models/member.types'
//  */
// export type RawMemberEntry = MemberChartEntry;

// // ─────────────────────────────────────────────
// // Helper: konversi berbagai format tanggal ke Date
// // ─────────────────────────────────────────────
// function toDate(raw: any): Date | null {
//     if (!raw) return null;
//     // Firestore Timestamp { seconds, nanoseconds }
//     if (typeof raw?.toDate === 'function') return raw.toDate();
//     // Firestore Timestamp plain object
//     if (typeof raw?.seconds === 'number') return new Date(raw.seconds * 1000);
//     // Date object
//     if (raw instanceof Date) return raw;
//     // ISO string atau timestamp number
//     const d = new Date(raw);
//     return isNaN(d.getTime()) ? null : d;
// }

// // ─────────────────────────────────────────────
// // Helper: buat map kosong dengan semua key terdefinisi
// // sehingga Recharts tetap render titik 0 (tidak bolong)
// // ─────────────────────────────────────────────
// function emptyMap(keys: string[]): Record<string, ChartPoint> {
//     return Object.fromEntries(
//         keys.map(k => [k, { label: k, active: 0, pending: 0 }])
//     );
// }

// // ─────────────────────────────────────────────
// // 1. HARIAN — 7 hari terakhir
// //    Sumbu X: Sen, Sel, Rab, Kam, Jum, Sab, Min
// // ─────────────────────────────────────────────
// const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// export function processDaily(data: RawMemberEntry[]): ChartPoint[] {
//     const now = new Date();
//     // Buat array 7 hari: [6 hari lalu, ..., hari ini]
//     const days = Array.from({ length: 7 }, (_, i) => {
//         const d = new Date(now);
//         d.setDate(now.getDate() - (6 - i));
//         d.setHours(0, 0, 0, 0);
//         return d;
//     });

//     // Key: "YYYY-MM-DD"
//     const fmt = (d: Date) =>
//         `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

//     const keys = days.map(fmt);
//     const map = emptyMap(keys);

//     // Overwrite label dengan nama hari
//     days.forEach(d => {
//         map[fmt(d)].label = DAY_NAMES[d.getDay()];
//     });

//     for (const entry of data) {
//         const date = toDate(entry.createdAt);
//         if (!date) continue;
//         const key = fmt(date);
//         if (!map[key]) continue;
//         if (entry.membershipStatus === 'active') map[key].active++;
//         if (entry.membershipStatus === 'pending') map[key].pending++;
//     }

//     return keys.map(k => map[k]);
// }

// // ─────────────────────────────────────────────
// // 2. MINGGUAN — 8 minggu terakhir
// //    Sumbu X: "01-07 Jan", "08-14 Jan", dst
// // ─────────────────────────────────────────────
// export function processWeekly(data: RawMemberEntry[]): ChartPoint[] {
//     const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
//     const now = new Date();
//     now.setHours(23, 59, 59, 999);

//     // Bangun 8 bucket minggu [start, end]
//     const weeks: { start: Date; end: Date; label: string }[] = [];
//     for (let i = 7; i >= 0; i--) {
//         const end = new Date(now);
//         end.setDate(now.getDate() - i * 7);
//         end.setHours(23, 59, 59, 999);

//         const start = new Date(end);
//         start.setDate(end.getDate() - 6);
//         start.setHours(0, 0, 0, 0);

//         const label = `${String(start.getDate()).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} ${MONTH_SHORT[end.getMonth()]}`;
//         weeks.push({ start, end, label });
//     }

//     const points: ChartPoint[] = weeks.map(w => ({ label: w.label, active: 0, pending: 0 }));

//     for (const entry of data) {
//         const date = toDate(entry.createdAt);
//         if (!date) continue;
//         const idx = weeks.findIndex(w => date >= w.start && date <= w.end);
//         if (idx === -1) continue;
//         if (entry.membershipStatus === 'active') points[idx].active++;
//         if (entry.membershipStatus === 'pending') points[idx].pending++;
//     }

//     return points;
// }

// // ─────────────────────────────────────────────
// // 3. BULANAN — 12 bulan terakhir
// //    Sumbu X: Jan, Feb, ..., Des
// // ─────────────────────────────────────────────
// const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

// export function processMonthly(data: RawMemberEntry[]): ChartPoint[] {
//     const now = new Date();
//     // Buat 12 bucket: [11 bulan lalu, ..., bulan ini]
//     const months = Array.from({ length: 12 }, (_, i) => {
//         const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
//         return { year: d.getFullYear(), month: d.getMonth() };
//     });

//     // Key: "YYYY-M"
//     const fmtKey = (y: number, m: number) => `${y}-${m}`;
//     const keys = months.map(m => fmtKey(m.year, m.month));
//     const map = emptyMap(keys);

//     months.forEach(m => {
//         map[fmtKey(m.year, m.month)].label = MONTH_SHORT[m.month];
//     });

//     for (const entry of data) {
//         const date = toDate(entry.createdAt);
//         if (!date) continue;
//         const key = fmtKey(date.getFullYear(), date.getMonth());
//         if (!map[key]) continue;
//         if (entry.membershipStatus === 'active') map[key].active++;
//         if (entry.membershipStatus === 'pending') map[key].pending++;
//     }

//     return keys.map(k => map[k]);
// }

// // ─────────────────────────────────────────────
// // 4. TAHUNAN — 5 tahun terakhir
// //    Sumbu X: 2022, 2023, 2024, 2025, 2026
// // ─────────────────────────────────────────────
// export function processYearly(data: RawMemberEntry[]): ChartPoint[] {
//     const currentYear = new Date().getFullYear();
//     const years = Array.from({ length: 5 }, (_, i) => currentYear - (4 - i));

//     const map = emptyMap(years.map(String));
//     years.forEach(y => { map[String(y)].label = String(y); });

//     for (const entry of data) {
//         const date = toDate(entry.createdAt);
//         if (!date) continue;
//         const key = String(date.getFullYear());
//         if (!map[key]) continue;
//         if (entry.membershipStatus === 'active') map[key].active++;
//         if (entry.membershipStatus === 'pending') map[key].pending++;
//     }

//     return years.map(y => map[String(y)]);
// }

// // ─────────────────────────────────────────────
// // MAIN: dispatcher berdasarkan TimeRange
// // ─────────────────────────────────────────────
// export function processChartData(
//     data: RawMemberEntry[],
//     range: TimeRange
// ): ChartPoint[] {
//     switch (range) {
//         case 'daily': return processDaily(data);
//         case 'weekly': return processWeekly(data);
//         case 'monthly': return processMonthly(data);
//         case 'yearly': return processYearly(data);
//         default: return processWeekly(data);
//     }
// }