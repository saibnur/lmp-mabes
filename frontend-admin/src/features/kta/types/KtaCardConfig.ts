/**
 * KtaCardConfig — skema konfigurasi format KTA Card (v3).
 * Disimpan di Firestore: collection "config" / document "kta".
 */

// ─── Layer Config ────────────────────────────────────────────────────────────

export interface LayerConfig {
    value: string;              // sample / fallback text for preview
    font: string;
    size: number;               // font size in px (native canvas)
    color: string;
    bold: boolean;              // font-weight: 700 when true
    stroke: boolean;
    strokeColor: string;
    strokeWidth: number;
    underline: boolean;
    underlineColor: string;
    underlineWidth: number;
    underlineGap: number;       // gap between baseline and underline bar
    underlineStroke: boolean;
    underlineStrokeColor: string;
    underlineStrokeWidth: number;
    align: 'left' | 'center' | 'right';
    letterSpacing: number;
    x: number;
    y: number;
    width: number;              // text container width in px
}

/**
 * TingkatConfig — Layer untuk level organisasi.
 *
 * Teks tingkat dipecah menjadi DUA BARIS TERPISAH agar posisi bisa diatur mandiri:
 *   line1 = prefix level  → "MARKAS", "MARKAS RANTING", "MARKAS CABANG", dst.
 *   line2 = nama wilayah  → "KEBAYORAN BARU", "JAKARTA SELATAN", "DKI JAKARTA", dst.
 *            (kosong jika hanya "MARKAS" tanpa nama wilayah)
 *
 * v3: Font keluarga dapat diatur MANDIRI per baris (line1Font, line2Font).
 *     Auto-scale: teks direntang/dipersempit untuk memenuhi containerWidth.
 */
export interface TingkatConfig {
    // ── Visual (shared): color, stroke, underline, align, letterSpacing ──
    color: string;
    stroke: boolean;
    strokeColor: string;
    strokeWidth: number;
    underline: boolean;
    underlineColor: string;
    underlineWidth: number;
    underlineGap: number;
    underlineStroke: boolean;
    underlineStrokeColor: string;
    underlineStrokeWidth: number;
    align: 'left' | 'center' | 'right';
    letterSpacing: number;

    // ── NEW v3: Auto-Scale Container Width ───────────────────────────────
    /** Lebar container (px) yang digunakan sebagai batas scaling kedua baris */
    autoScaleContainerWidth: number;

    // ── Baris 1: Label level ("MARKAS", "MARKAS RANTING", dst.) ──────────
    line1Font: string;          // independent font per baris
    line1Size: number;
    line1X: number;
    line1Y: number;
    line1Width: number;
    line1AutoScale: boolean;    // aktifkan auto-fit horizontal
    /** Sample / preview value for line 1 */
    line1Value: string;

    // ── Baris 2: Nama wilayah ("KEBAYORAN BARU", dst.) ───────────────────
    line2Font: string;          // independent font per baris
    line2Size: number;
    line2X: number;
    line2Y: number;
    line2Width: number;
    line2AutoScale: boolean;    // aktifkan auto-fit horizontal
    /** Sample / preview value for line 2 */
    line2Value: string;
}

// ─── Full Config ─────────────────────────────────────────────────────────────

export interface KtaCardConfig {
    _version: number;
    _updatedAt: string;

    /** Canvas native size (pixels for html2canvas export) */
    canvas: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
    };

    /** Preview scale for editor display only (not exported) */
    preview: {
        scale: number;
    };

    background: {
        imageUrl: string;
        objectFit: 'fill' | 'cover' | 'contain';
    };

    photo: {
        top: number;
        left: number;
        size: number;
        borderWidth: number;
        borderColor: string;
        borderRadius: string;
    };

    layers: {
        tingkat: TingkatConfig;
        nama: LayerConfig;
        jabatan: LayerConfig;
        kta: LayerConfig;
        expired: LayerConfig;
    };
}

// ─── Default ─────────────────────────────────────────────────────────────────

export const DEFAULT_KTA_CONFIG: KtaCardConfig = {
    _version: 3,
    _updatedAt: new Date().toISOString(),

    canvas: {
        width: 800,
        height: 1280,
        borderRadius: 10,
        backgroundColor: '#111111',
    },

    preview: {
        scale: 0.5,
    },

    background: {
        imageUrl: 'https://res.cloudinary.com/dlbaqfy7z/image/upload/v1771728844/lmp-kta-format_ajzczf.png',
        objectFit: 'fill',
    },

    photo: {
        top: 440,
        left: 186,
        size: 421,
        borderWidth: 4,
        borderColor: '#c8102e',
        borderRadius: '50%',
    },

    layers: {
        tingkat: {
            color: '#ffffff',
            stroke: false,
            strokeColor: '#000000',
            strokeWidth: 2,
            underline: false,
            underlineColor: '#ffffff',
            underlineWidth: 1,
            underlineGap: 3,
            underlineStroke: false,
            underlineStrokeColor: '#000000',
            underlineStrokeWidth: 0,
            align: 'center',
            letterSpacing: 0,
            // Auto-scale container
            autoScaleContainerWidth: 760,
            // Baris 1 — label level
            line1Font: 'Anton',
            line1Size: 35,
            line1X: 20,
            line1Y: 140,
            line1Width: 760,
            line1AutoScale: false,
            line1Value: 'MARKAS RANTING',
            // Baris 2 — nama wilayah
            line2Font: 'Anton',
            line2Size: 50,
            line2X: 20,
            line2Y: 185,
            line2Width: 760,
            line2AutoScale: false,
            line2Value: 'KEBAYORAN BARU',
        },
        nama: {
            value: 'Rizky Aprinanda',
            font: 'Anton',
            size: 50,
            color: '#000000',
            bold: false,
            stroke: true,
            strokeColor: '#ffffff',
            strokeWidth: 2.5,
            underline: true,
            underlineColor: '#000000',
            underlineWidth: 2,
            underlineGap: 5,
            underlineStroke: true,
            underlineStrokeColor: '#ffffff',
            underlineStrokeWidth: 1,
            align: 'center',
            letterSpacing: 0,
            x: 176,
            y: 886,
            width: 450,
        },
        jabatan: {
            value: 'ANGGOTA',
            font: 'Georgia',
            size: 50,
            color: '#000000',
            bold: false,
            stroke: true,
            strokeColor: '#ffffff',
            strokeWidth: 1,
            underline: false,
            underlineColor: '#ffffff',
            underlineWidth: 1,
            underlineGap: 3,
            underlineStroke: false,
            underlineStrokeColor: '#ffffff',
            underlineStrokeWidth: 0,
            align: 'center',
            letterSpacing: 1,
            x: 202,
            y: 955,
            width: 432,
        },
        kta: {
            value: '31.07.25.01.0001',
            font: 'Roboto',
            size: 45,
            color: '#ffffff',
            bold: false,
            stroke: false,
            strokeColor: '#000000',
            strokeWidth: 2,
            underline: false,
            underlineColor: '#ffffff',
            underlineWidth: 1,
            underlineGap: 3,
            underlineStroke: false,
            underlineStrokeColor: '#000000',
            underlineStrokeWidth: 0,
            align: 'left',
            letterSpacing: 0,
            x: 39,
            y: 1076,
            width: 370,
        },
        expired: {
            value: 'Exp 31.12.2026',
            font: 'Roboto',
            size: 45,
            color: '#ffffff',
            bold: false,
            stroke: false,
            strokeColor: '#000000',
            strokeWidth: 2,
            underline: false,
            underlineColor: '#ffffff',
            underlineWidth: 1,
            underlineGap: 3,
            underlineStroke: false,
            underlineStrokeColor: '#000000',
            underlineStrokeWidth: 0,
            align: 'right',
            letterSpacing: 0,
            x: 385,
            y: 1072,
            width: 368,
        },
    },
};
