'use client';

import { useDashboardStats } from '@/viewmodels/useDashboardStats';
import StatsCard from '@/components/dashboard/StatsCard';
import RegistrationChart from '@/components/dashboard/RegistrationChart';
import { Users, UserCheck, Clock, AlertTriangle, Shield } from 'lucide-react';

export default function DashboardPage() {
    const { stats, isLoading, range, setRange, selectedDate, setSelectedDate } = useDashboardStats();

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-black text-white">Selamat Datang, Admin 👋</h1>
                <p className="text-sm text-white/40 mt-1">Ringkasan data LMP Mabes secara real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatsCard
                    label="Total Member"
                    value={isLoading ? '...' : stats?.totalMembers ?? 0}
                    icon={Users}
                    color="brand"
                />
                <StatsCard
                    label="Member Aktif"
                    value={isLoading ? '...' : stats?.activeMembers ?? 0}
                    icon={UserCheck}
                    color="success"
                />
                <StatsCard
                    label="Pending"
                    value={isLoading ? '...' : stats?.pendingMembers ?? 0}
                    icon={Clock}
                    color="warning"
                />
                <StatsCard
                    label="Expired"
                    value={isLoading ? '...' : stats?.expiredMembers ?? 0}
                    icon={AlertTriangle}
                    color="danger"
                />
                <StatsCard
                    label="Admin"
                    value={isLoading ? '...' : stats?.totalAdmins ?? 0}
                    icon={Shield}
                    color="accent"
                />
            </div>

            {/* Registration Chart */}
            <RegistrationChart
                data={stats?.registrationData ?? []}
                range={range}
                onRangeChange={setRange}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />
        </div>
    );
}
