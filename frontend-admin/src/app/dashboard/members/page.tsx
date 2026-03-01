'use client';

import { useState } from 'react';
import { useMemberManager } from '@/viewmodels/useMemberManager';
import { useKtaPreview } from '@/features/kta/hooks/useKtaPreview';
import MemberSearch from '@/components/members/MemberSearch';
import RegionFilter from '@/components/members/RegionFilter';
import MemberTable from '@/components/members/MemberTable';
import EditRoleModal from '@/components/members/EditRoleModal';
import KtaPreviewModal from '@/features/kta/components/KtaPreviewModal';
import type { Member } from '@/models/member.types';

export default function MembersPage() {
    const vm = useMemberManager();
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const { previewMember, ktaConfig, openPreview, closePreview } = useKtaPreview();

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-black text-foreground">Manajemen Member</h1>
                <p className="text-sm text-text-muted mt-0.5">
                    {vm.isLoading ? 'Memuat...' : `${vm.totalMembers} member ditemukan`}
                </p>
            </div>

            <MemberSearch
                value={vm.search}
                onChange={vm.setSearch}
                email={vm.searchEmail}
                onEmailChange={vm.setSearchEmail}
                phone={vm.searchPhone}
                onPhoneChange={vm.setSearchPhone}
            />

            <RegionFilter
                provinceId={vm.provinceId}
                regencyId={vm.regencyId}
                districtId={vm.districtId}
                villageId={vm.villageId}
                onProvinceChange={vm.handleProvinceChange}
                onRegencyChange={vm.handleRegencyChange}
                onDistrictChange={vm.handleDistrictChange}
                onVillageChange={vm.handleVillageChange}
                onReset={vm.resetFilters}
            />

            <MemberTable
                members={vm.members}
                totalMembers={vm.totalMembers}
                page={vm.page}
                totalPages={vm.totalPages}
                onPageChange={vm.setPage}
                onEdit={(m) => setEditingMember(m)}
                onPreview={openPreview}
                isLoading={vm.isLoading}
            />

            <EditRoleModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
                onSave={vm.updateRole}
                isUpdating={vm.isUpdatingRole}
            />

            {/* Modal KTA — reusable, bisa dipanggil dari mana saja di halaman ini */}
            <KtaPreviewModal
                member={previewMember}
                ktaConfig={ktaConfig}
                onClose={closePreview}
            />
        </div>
    );
}