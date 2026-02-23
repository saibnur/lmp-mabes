import React, { forwardRef, CSSProperties, useRef, useLayoutEffect, useState } from 'react';
import { KtaCardConfig, DEFAULT_KTA_CONFIG, LayerConfig, TingkatConfig } from '../types/KtaCardConfig';

// ─── Region name abbreviation helpers ────────────────────────────────────────

/**
 * Singkat "Kabupaten ..." → "Kab. ..." dan "Kota ..." → "Kot. ..."
 * hanya jika nama dimulai dengan kata tersebut (case-insensitive).
 */
function shortenKabKot(name: string): string {
    if (!name) return '';
    if (/^kabupaten\s/i.test(name)) return 'Kab. ' + name.replace(/^kabupaten\s/i, '');
    if (/^kota\s/i.test(name)) return '' + name.replace(/^kota\s/i, '');
    return name;
}

/**
 * Singkat "Kelurahan ..." → "Kel. ..." dan "Desa ..." → "Ds. ..."
 */
function shortenKelDes(name: string): string {
    if (!name) return '';
    if (/^kelurahan\s/i.test(name)) return 'Kel. ' + name.replace(/^kelurahan\s/i, '');
    if (/^desa\s/i.test(name)) return 'Ds. ' + name.replace(/^desa\s/i, '');
    return name;
}

/**
 * Singkat "Kecamatan ..." → "Kec. ..."
 */
function shortenKec(name: string): string {
    if (!name) return '';
    if (/^kecamatan\s/i.test(name)) return 'Kec. ' + name.replace(/^kecamatan\s/i, '');
    return name;
}

// ─── Level text builder ──────────────────────────────────────────────────────

type OrgLevel = 'daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '';

interface RegionNames {
    provinceName: string;
    regencyName: string;
    districtName: string;
    villageName: string;
}

/**
 * Builds [line1, line2] from orgLevel + regionNames data.
 * Returns ["", ""] if level is empty / unknown.
 */
function buildLevelTexts(
    orgLevel: OrgLevel | undefined,
    regionNames: RegionNames | undefined
): [string, string] {
    if (!orgLevel || !regionNames) return ['', ''];
    const { provinceName, regencyName, districtName, villageName } = regionNames;
    switch (orgLevel) {
        case 'daerah':
            return ['MARKAS DAERAH', provinceName.toUpperCase()];
        case 'cabang':
            return ['MARKAS CABANG', regencyName.toUpperCase()];
        case 'anak-cabang': {
            const kec = shortenKec(districtName).toUpperCase();
            const kab = shortenKabKot(regencyName).toUpperCase();
            return ['MARKAS ANAK CABANG', `${kec} - ${kab}`];
        }
        case 'ranting': {
            const kel = shortenKelDes(villageName).toUpperCase();
            const kab = shortenKabKot(regencyName).toUpperCase();
            return ['MARKAS RANTING', `${kel} - ${kab}`];
        }
        default:
            return ['', ''];
    }
}

/**
 * Legacy fallback: splits levelText string into [line1, line2].
 */
function splitLevelText(text: string): [string, string] {
    const prefixes = [
        'MARKAS ANAK CABANG ',
        'MARKAS RANTING ',
        'MARKAS CABANG ',
        'MARKAS DAERAH ',
    ];
    for (const p of prefixes) {
        if (text.startsWith(p)) {
            return [p.trim(), text.slice(p.length).trim()];
        }
    }
    return [text.trim(), ''];
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function layerStyle(
    x: number, y: number, width: number, size: number,
    lyr: {
        font: string; color: string; stroke: boolean; strokeColor: string; strokeWidth: number;
        align: 'left' | 'center' | 'right'; letterSpacing: number; bold?: boolean;
    }
): CSSProperties {
    return {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        textAlign: lyr.align,
        fontFamily: lyr.font === 'Arial Narrow'
            ? `'Arial Narrow', 'Arial', sans-serif`
            : `'${lyr.font}', sans-serif`,
        fontSize: `${size}px`,
        fontWeight: lyr.bold ? 700 : 400,
        color: lyr.color,
        letterSpacing: lyr.letterSpacing > 0 ? `${lyr.letterSpacing}px` : '0px',
        WebkitTextStroke: lyr.stroke ? `${lyr.strokeWidth}px ${lyr.strokeColor}` : '0px transparent',
        lineHeight: 1,
        display: 'block',
        boxSizing: 'border-box',
        margin: 0,
        padding: 0,
        wordSpacing: '0px',
        fontFeatureSettings: '"kern" 1',
        textRendering: 'geometricPrecision',
        zIndex: 2,
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        overflow: 'visible',
    };
}

function layerStyleFull(lyr: LayerConfig): CSSProperties {
    return layerStyle(lyr.x, lyr.y, lyr.width, lyr.size, lyr);
}

// ─── UnderlineBar ─────────────────────────────────────────────────────────────

function UnderlineBar({
    x, y, size, width, lyr,
}: {
    x: number; y: number; size: number; width: number;
    lyr: {
        underline: boolean; underlineColor: string; underlineWidth: number; underlineGap: number;
        underlineStroke: boolean; underlineStrokeColor: string; underlineStrokeWidth: number;
    };
}) {
    if (!lyr.underline) return null;
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y + size * 1.2 + lyr.underlineGap}px`,
                width: `${width}px`,
                height: `${lyr.underlineWidth}px`,
                backgroundColor: lyr.underlineColor,
                boxShadow: lyr.underlineStroke
                    ? `0 0 0 ${lyr.underlineStrokeWidth}px ${lyr.underlineStrokeColor}`
                    : undefined,
                zIndex: 2,
                pointerEvents: 'none',
            }}
        />
    );
}

// ─── AutoScaleText ────────────────────────────────────────────────────────────

/**
 * Renders text that auto-scales horizontally to fill containerWidth.
 * Uses transformOrigin: 'left center' ALWAYS to avoid the right-shift bug that
 * occurs when textAlign:center fails to position overflowing inline-block at a
 * negative x (browser clamps to x=0), making the scale origin incorrect.
 * The outer div uses textAlign:'left' so the inner block sits at x=0 reliably.
 */
function AutoScaleText({
    text,
    style,
    containerWidth,
}: {
    text: string;
    style: CSSProperties;
    containerWidth: number;
}) {
    const innerRef = useRef<HTMLDivElement>(null);
    const [scaleX, setScaleX] = useState(1);

    useLayoutEffect(() => {
        if (!innerRef.current) return;
        // Temporarily clear any existing transform so scrollWidth gives natural width
        const el = innerRef.current;
        const prev = el.style.transform;
        el.style.transform = 'none';
        const naturalWidth = el.scrollWidth;
        el.style.transform = prev;
        if (naturalWidth > 0 && containerWidth > 0) {
            setScaleX(containerWidth / naturalWidth);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, style.fontFamily, style.fontSize, style.letterSpacing, containerWidth]);

    return (
        <div
            style={{
                ...style,
                width: `${containerWidth}px`,
                overflow: 'visible',
                // Force left so inner div always starts at x=0 — scale origin is always left
                textAlign: 'left',
            }}
        >
            <div
                ref={innerRef}
                style={{
                    display: 'inline-block',
                    transformOrigin: 'left center',   // always left — no centering offset error
                    transform: `scaleX(${scaleX})`,
                    whiteSpace: 'nowrap',
                    lineHeight: style.lineHeight,
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    letterSpacing: style.letterSpacing,
                    WebkitTextStroke: style.WebkitTextStroke,
                    textRendering: 'geometricPrecision',
                    fontFeatureSettings: '"kern" 1',
                }}
            >
                {text}
            </div>
        </div>
    );
}

// ─── NamaLayer (dynamic underline) ───────────────────────────────────────────

/**
 * Renders the Nama text with a dynamic underline that follows the actual text width.
 *
 * KEY: The outer div has fixed width (lyr.width) + overflow:visible.
 * scrollWidth on a fixed-width block = max(textWidth, divWidth), so it returns
 * the div's width when text is shorter. Instead we wrap text in an inline-block
 * <span> and measure offsetWidth — that gives the true natural text width.
 */
function NamaLayer({
    lyr,
    text,
}: {
    lyr: LayerConfig;
    text: string;
}) {
    const spanRef = useRef<HTMLSpanElement>(null);
    const [textWidth, setTextWidth] = useState<number | null>(null);

    useLayoutEffect(() => {
        if (!spanRef.current) return;
        const w = spanRef.current.offsetWidth;
        if (w > 0) setTextWidth(w);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, lyr.font, lyr.size, lyr.letterSpacing, lyr.bold]);

    const underlineWidth = textWidth ?? lyr.width;

    // Align underline X to match where the text visually sits within its container
    const underlineX = (() => {
        if (lyr.align === 'center') return lyr.x + (lyr.width - underlineWidth) / 2;
        if (lyr.align === 'right') return lyr.x + lyr.width - underlineWidth;
        return lyr.x;
    })();

    const style = layerStyleFull(lyr);

    return (
        <>
            <div style={style}>
                {/* inline-block span: offsetWidth = natural text width, never inflated by div's width */}
                <span
                    ref={spanRef}
                    style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                >
                    {text}
                </span>
            </div>
            <UnderlineBar
                x={underlineX}
                y={lyr.y}
                size={lyr.size}
                width={underlineWidth}
                lyr={lyr}
            />
        </>
    );
}


// ─── KtaCard ─────────────────────────────────────────────────────────────────

export interface KtaCardProps {
    photoUrl?: string;
    displayName: string;
    /**
     * Legacy prop: full level text — e.g. "MARKAS RANTING KEBAYORAN BARU".
     * Used as fallback when orgLevel + regionNames are not provided.
     */
    levelText?: string;
    /** Direct data binding from ProfilForm (Step 3) */
    orgLevel?: OrgLevel;
    regionNames?: RegionNames;
    jabatanText?: string;
    noKta?: string;
    isActive: boolean;
    expiryDate?: Date | null;
    scale?: number;
    className?: string;
    config?: KtaCardConfig;
}

const KtaCard = forwardRef<HTMLDivElement, KtaCardProps>(
    (
        {
            photoUrl,
            displayName,
            levelText,
            orgLevel,
            regionNames,
            jabatanText = 'ANGGOTA',
            noKta,
            isActive,
            expiryDate,
            scale = 1,
            className = '',
            config,
        },
        ref
    ) => {
        const c = config ?? DEFAULT_KTA_CONFIG;
        const lyr = c.layers;
        const tin = lyr.tingkat;

        // Arial Narrow is a system font — add a @font-face local() declaration for safety
        const fontStyles = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;700;900&family=Roboto:wght@400;900&family=Oswald:wght@400;700&family=Inter:wght@400;700;900&display=swap');
@font-face {
  font-family: 'Arial Narrow';
  src: local('Arial Narrow');
  font-style: normal;
}
`.trim();

        // Expired text
        const expiredText = (() => {
            if (!isActive) return 'BELUM AKTIF';
            if (expiryDate) {
                const dd = String(expiryDate.getDate()).padStart(2, '0');
                const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
                const yyyy = expiryDate.getFullYear();
                return `Exp ${dd}.${mm}.${yyyy}`;
            }
            return 'AKTIF';
        })();

        // Determine line1 & line2 texts
        let line1Text: string;
        let line2Text: string;

        if (orgLevel) {
            [line1Text, line2Text] = buildLevelTexts(orgLevel, regionNames);
        } else if (levelText) {
            [line1Text, line2Text] = splitLevelText(levelText);
        } else {
            line1Text = 'MARKAS';
            line2Text = '';
        }

        // Shared tingkat visual props (for layerStyle calls on baris)
        const tinShared = {
            color: tin.color,
            stroke: tin.stroke,
            strokeColor: tin.strokeColor,
            strokeWidth: tin.strokeWidth,
            align: tin.align,
            letterSpacing: tin.letterSpacing,
        };

        // Per-baris layerStyle (independent fonts)
        const style1 = layerStyle(tin.line1X, tin.line1Y, tin.line1Width, tin.line1Size, {
            ...tinShared,
            font: tin.line1Font ?? 'Anton',
        });
        const style2 = layerStyle(tin.line2X, tin.line2Y, tin.line2Width, tin.line2Size, {
            ...tinShared,
            font: tin.line2Font ?? 'Anton',
        });

        // UnderlineBar props for tingkat (fixed width, from config)
        const tinUnderlineLyr = {
            underline: tin.underline,
            underlineColor: tin.underlineColor,
            underlineWidth: tin.underlineWidth,
            underlineGap: tin.underlineGap,
            underlineStroke: tin.underlineStroke,
            underlineStrokeColor: tin.underlineStrokeColor,
            underlineStrokeWidth: tin.underlineStrokeWidth,
        };

        return (
            <div
                className={`relative ${className}`}
                style={{
                    width: c.canvas.width * scale,
                    height: c.canvas.height * scale,
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {/* Inner: always full native size, CSS-scaled */}
                <div
                    ref={ref}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${c.canvas.width}px`,
                        height: `${c.canvas.height}px`,
                        overflow: 'hidden',
                        borderRadius: `${c.canvas.borderRadius}px`,
                        boxShadow: '0 12px 60px rgba(0,0,0,0.8)',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        backgroundColor: c.canvas.backgroundColor,
                        lineHeight: 1,
                        fontFamily: 'sans-serif',
                        fontSize: '16px',
                        margin: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <style>{fontStyles}</style>

                    {/* Background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={c.background.imageUrl}
                        alt=""
                        crossOrigin="anonymous"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: c.background.objectFit,
                            zIndex: 0, pointerEvents: 'none',
                        }}
                    />

                    {/* Photo */}
                    <div
                        style={{
                            position: 'absolute',
                            top: `${c.photo.top}px`,
                            left: `${c.photo.left}px`,
                            width: `${c.photo.size}px`,
                            height: `${c.photo.size}px`,
                            borderRadius: c.photo.borderRadius,
                            overflow: 'hidden',
                            border: `${c.photo.borderWidth}px solid ${c.photo.borderColor}`,
                            zIndex: 3,
                            backgroundColor: '#ccc',
                        }}
                    >
                        {photoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl} alt="Foto"
                                crossOrigin="anonymous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                    </div>

                    {/* ── Tingkat Baris 1 ── */}
                    {tin.line1AutoScale ? (
                        <AutoScaleText
                            text={line1Text}
                            style={style1}
                            containerWidth={tin.autoScaleContainerWidth ?? tin.line1Width}
                        />
                    ) : (
                        <div style={style1}>{line1Text}</div>
                    )}
                    <UnderlineBar
                        x={tin.line1X} y={tin.line1Y} size={tin.line1Size}
                        width={tin.line1Width}
                        lyr={tinUnderlineLyr}
                    />

                    {/* ── Tingkat Baris 2 ── */}
                    {line2Text && (
                        <>
                            {tin.line2AutoScale ? (
                                <AutoScaleText
                                    text={line2Text}
                                    style={style2}
                                    containerWidth={tin.autoScaleContainerWidth ?? tin.line2Width}
                                />
                            ) : (
                                <div style={style2}>{line2Text}</div>
                            )}
                            <UnderlineBar
                                x={tin.line2X} y={tin.line2Y} size={tin.line2Size}
                                width={tin.line2Width}
                                lyr={tinUnderlineLyr}
                            />
                        </>
                    )}

                    {/* ── Nama (dynamic underline) ── */}
                    {/* ── Nama (dynamic underline) ── */}
                    <NamaLayer
                        lyr={{
                            ...lyr.nama,
                            align: 'center' // Memaksa teks agar selalu rata tengah
                        }}
                        text={(displayName || '-').toUpperCase()}
                    />

                    {/* ── Jabatan ── */}
                    <div style={layerStyleFull(lyr.jabatan)}>{jabatanText}</div>
                    <UnderlineBar
                        x={lyr.jabatan.x} y={lyr.jabatan.y} size={lyr.jabatan.size}
                        width={lyr.jabatan.width}
                        lyr={lyr.jabatan}
                    />

                    {/* ── No KTA ── */}
                    <div style={layerStyleFull(lyr.kta)}>{noKta ?? lyr.kta.value}</div>
                    <UnderlineBar
                        x={lyr.kta.x} y={lyr.kta.y} size={lyr.kta.size}
                        width={lyr.kta.width}
                        lyr={lyr.kta}
                    />

                    {/* ── Expired / Status ── */}
                    <div
                        style={{
                            ...layerStyleFull(lyr.expired),
                            color: isActive ? lyr.expired.color : '#ef4444',
                        }}
                    >
                        {expiredText}
                    </div>
                    <UnderlineBar
                        x={lyr.expired.x} y={lyr.expired.y} size={lyr.expired.size}
                        width={lyr.expired.width}
                        lyr={lyr.expired}
                    />
                </div>
            </div>
        );
    }
);

KtaCard.displayName = 'KtaCard';
export default KtaCard;
