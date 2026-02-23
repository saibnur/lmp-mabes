'use client';

import { useState } from 'react';
import { useMemberManager } from '@/viewmodels/useMemberManager';
import MemberSearch from '@/components/members/MemberSearch';
import RegionFilter from '@/components/members/RegionFilter';
import MemberTable from '@/components/members/MemberTable';
import EditRoleModal from '@/components/members/EditRoleModal';
import type { Member } from '@/models/member.types';

export default function MembersPage() {
    const vm = useMemberManager();
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-black text-white">Manajemen Member</h1>
                <p className="text-sm text-white/40 mt-0.5">
                    {vm.isLoading ? 'Memuat...' : `${vm.totalMembers} member ditemukan`}
                </p>
            </div>

            {/* Search — 3 fields */}
            <MemberSearch
                value={vm.search}
                onChange={vm.setSearch}
                email={vm.searchEmail}
                onEmailChange={vm.setSearchEmail}
                phone={vm.searchPhone}
                onPhoneChange={vm.setSearchPhone}
            />

            {/* Region Filters */}
            <RegionFilter
                provinceId={vm.provinceId}
                cityId={vm.cityId}
                districtId={vm.districtId}
                villageId={vm.villageId}
                onProvinceChange={vm.handleProvinceChange}
                onCityChange={vm.handleCityChange}
                onDistrictChange={vm.handleDistrictChange}
                onVillageChange={vm.handleVillageChange}
                onReset={vm.resetFilters}
            />

            {/* Table (desktop) / Cards (mobile) */}
            <MemberTable
                members={vm.members}
                totalMembers={vm.totalMembers}
                page={vm.page}
                totalPages={vm.totalPages}
                onPageChange={vm.setPage}
                onEdit={(m) => setEditingMember(m)}
                isLoading={vm.isLoading}
            />

            {/* Edit Modal */}
            <EditRoleModal
                member={editingMember}
                onClose={() => setEditingMember(null)}
                onSave={vm.updateRole}
                isUpdating={vm.isUpdatingRole}
            />
        </div>
    );
}
