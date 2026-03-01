'use client';

import { useDashboardStats } from '@/viewmodels/useDashboardStats';
import StatsCard from '@/components/dashboard/StatsCard';
import RegistrationChart from '@/components/dashboard/RegistrationChart';
import { Users, UserCheck, Clock, AlertTriangle, Shield } from 'lucide-react';

export default function DashboardPage() {
    const { stats, isLoading, range, setRange } = useDashboardStats();

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
                <StatsCard label="Total Member" value={isLoading ? '...' : stats?.totalMembers ?? 0} icon={Users} color="brand" />
                <StatsCard label="Member Aktif" value={isLoading ? '...' : stats?.activeMembers ?? 0} icon={UserCheck} color="success" />
                <StatsCard label="Pending" value={isLoading ? '...' : stats?.pendingMembers ?? 0} icon={Clock} color="warning" />
                <StatsCard label="Expired" value={isLoading ? '...' : stats?.expiredMembers ?? 0} icon={AlertTriangle} color="danger" />
                <StatsCard label="Admin" value={isLoading ? '...' : stats?.totalAdmins ?? 0} icon={Shield} color="accent" />
            </div>

            <RegistrationChart
                data={stats?.registrationData ?? []}
                range={range}
                onRangeChange={setRange}
                isLoading={isLoading}
            />
        </div>
    );
}