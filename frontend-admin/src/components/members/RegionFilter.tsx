'use client';

import { useRegions } from '@/viewmodels/useRegions';
import { MapPin, RotateCcw, Loader2 } from 'lucide-react';

interface RegionFilterProps {
    provinceId: string;
    cityId: string;
    districtId: string;
    villageId: string;
    onProvinceChange: (id: string) => void;
    onCityChange: (id: string) => void;
    onDistrictChange: (id: string) => void;
    onVillageChange: (id: string) => void;
    onReset: () => void;
}

export default function RegionFilter({
    provinceId,
    cityId,
    districtId,
    villageId,
    onProvinceChange,
    onCityChange,
    onDistrictChange,
    onVillageChange,
    onReset,
}: RegionFilterProps) {
    const { provinces, cities, districts, villages, isLoadingProvinces, isLoadingCities, isLoadingDistricts, isLoadingVillages } =
        useRegions(provinceId, cityId, districtId);

    const selectClass =
        'w-full rounded-xl border border-border-custom bg-surface py-2.5 pl-3 pr-8 text-sm text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 appearance-none cursor-pointer disabled:opacity-50';

    return (
        <div className="glass-card p-4">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <MapPin className="h-4 w-4" />
                    Filter Wilayah
                </div>
                {(provinceId || cityId || districtId || villageId) && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1 text-xs text-brand-light hover:text-brand transition"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Provinsi */}
                <div className="relative">
                    <select
                        value={provinceId}
                        onChange={(e) => onProvinceChange(e.target.value)}
                        className={selectClass}
                        disabled={isLoadingProvinces}
                    >
                        <option value="">Semua Provinsi</option>
                        {provinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {isLoadingProvinces && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
                </div>

                {/* Kab/Kota */}
                <div className="relative">
                    <select
                        value={cityId}
                        onChange={(e) => onCityChange(e.target.value)}
                        className={selectClass}
                        disabled={!provinceId || isLoadingCities}
                    >
                        <option value="">Semua Kab/Kota</option>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {isLoadingCities && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
                </div>

                {/* Kecamatan */}
                <div className="relative">
                    <select
                        value={districtId}
                        onChange={(e) => onDistrictChange(e.target.value)}
                        className={selectClass}
                        disabled={!cityId || isLoadingDistricts}
                    >
                        <option value="">Semua Kecamatan</option>
                        {districts.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    {isLoadingDistricts && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
                </div>

                {/* Kelurahan/Desa */}
                <div className="relative">
                    <select
                        value={villageId}
                        onChange={(e) => onVillageChange(e.target.value)}
                        className={selectClass}
                        disabled={!districtId || isLoadingVillages}
                    >
                        <option value="">Semua Kel/Desa</option>
                        {villages.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                    {isLoadingVillages && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
                </div>
            </div>
        </div>
    );
}
