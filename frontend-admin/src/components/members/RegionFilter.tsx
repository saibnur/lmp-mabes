'use client';

import { useState } from 'react';
import { useRegions } from '@/viewmodels/useRegions';
import { MapPin, RotateCcw, Loader2, ChevronDown } from 'lucide-react';

interface RegionFilterProps {
    provinceId: string;
    regencyId: string;
    districtId: string;
    villageId: string;
    onProvinceChange: (id: string) => void;
    onRegencyChange: (id: string) => void;
    onDistrictChange: (id: string) => void;
    onVillageChange: (id: string) => void;
    onReset: () => void;
}

function RegionSelect({
    value,
    onChange,
    disabled,
    isLoading,
    placeholder,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    placeholder: string;
    options: { id: string; name: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || isLoading}
                className="w-full appearance-none rounded-xl border border-border-custom
                           bg-surface-hover
                           py-2.5 pl-3 pr-8
                           text-sm text-slate-800 dark:text-slate-100
                           outline-none transition-all cursor-pointer
                           focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10
                           disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <option value="" className="text-slate-500">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id} className="text-slate-800">{o.name}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {isLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ChevronDown className="h-3.5 w-3.5" />
                }
            </div>
        </div>
    );
}

export default function RegionFilter({
    provinceId,
    regencyId,
    districtId,
    villageId,
    onProvinceChange,
    onRegencyChange,
    onDistrictChange,
    onVillageChange,
    onReset,
}: RegionFilterProps) {
    const [expanded, setExpanded] = useState(false);

    const {
        provinces, cities, districts, villages,
        isLoadingProvinces, isLoadingCities, isLoadingDistricts, isLoadingVillages,
    } = useRegions(provinceId, regencyId, districtId);

    const hasFilter = !!(provinceId || regencyId || districtId || villageId);
    const activeCount = [provinceId, regencyId, districtId, villageId].filter(Boolean).length;

    return (
        <div className="rounded-xl border border-border-custom bg-surface shadow-sm overflow-hidden">
            {/* Header toggle */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left
                           hover:bg-surface-hover/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <MapPin className={`h-4 w-4 shrink-0 ${hasFilter ? 'text-brand-primary' : 'text-text-muted'}`} />
                    <span className={`text-sm font-bold ${hasFilter ? 'text-foreground' : 'text-text-muted'}`}>
                        Filter Wilayah
                    </span>
                    {activeCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full
                                         bg-slate-900 text-[10px] font-black text-white">
                            {activeCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {hasFilter && (
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); onReset(); }}
                            className="flex items-center gap-1 rounded-lg px-2 py-1
                                       text-[11px] font-bold text-text-muted
                                       hover:bg-surface-hover hover:text-foreground transition-all"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-200
                                            ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Panel selects */}
            {expanded && (
                <div className="border-t border-border-custom/50 px-4 pb-4 pt-3
                                grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3
                                animate-in fade-in slide-in-from-top-1 duration-200">
                    <RegionSelect
                        value={provinceId}
                        onChange={onProvinceChange}
                        isLoading={isLoadingProvinces}
                        placeholder="Semua Provinsi"
                        options={provinces}
                    />
                    <RegionSelect
                        value={regencyId}
                        onChange={onRegencyChange}
                        disabled={!provinceId}
                        isLoading={isLoadingCities}
                        placeholder="Semua Kab/Kota"
                        options={cities}
                    />
                    <RegionSelect
                        value={districtId}
                        onChange={onDistrictChange}
                        disabled={!regencyId}
                        isLoading={isLoadingDistricts}
                        placeholder="Semua Kecamatan"
                        options={districts}
                    />
                    <RegionSelect
                        value={villageId}
                        onChange={onVillageChange}
                        disabled={!districtId}
                        isLoading={isLoadingVillages}
                        placeholder="Semua Kel/Desa"
                        options={villages}
                    />
                </div>
            )}
        </div>
    );
}