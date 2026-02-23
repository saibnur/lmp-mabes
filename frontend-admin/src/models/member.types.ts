/**
 * TypeScript interfaces for the LMP Mabes data model.
 * Matches the Firestore `users` collection schema.
 */

export interface Organization {
    province_id?: string;
    province_name?: string;
    city_id?: string;
    city_name?: string;
    district_id?: string;
    district_name?: string;
    village_id?: string;
    village_name?: string;
    updatedAt?: string;
}

export interface Kepengurusan {
    level: 'provinsi' | 'kab_kota' | 'kecamatan' | 'kelurahan';
    region_id: string;
    region_name: string;
    jabatan?: string;
    assignedAt?: string;
    assignedBy?: string;
}

export interface Member {
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string;
    phone?: string;
    nik?: string;
    no_kta?: string;
    photoURL?: string;
    ktpURL?: string;
    role: 'member' | 'admin';
    status: 'active' | 'inactive';
    membershipStatus: 'pending' | 'active' | 'expired';
    hasPassword?: boolean;
    organization?: Organization;
    kepengurusan?: Kepengurusan;
    createdAt?: any;
    updatedAt?: any;
    membershipExpiry?: any;
    lastPaymentDate?: any;
}

export interface Region {
    id: string;
    name: string;
}

export interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    expiredMembers: number;
    totalAdmins: number;
    registrationData: RegistrationDataPoint[];
}

export interface RegistrationDataPoint {
    label: string;
    active: number;
    pending: number;
}

export type TimeRange = 'hourly' | 'weekly' | 'monthly' | 'yearly';

export interface NewsItem {
    id: string;
    title: string;
    content: string;
    category: 'berita' | 'acara' | 'kegiatan';
    imageURL?: string;
    author: string;
    authorUid: string;
    published: boolean;
    createdAt?: any;
    updatedAt?: any;
}

export interface NikCheckResult {
    nik: string;
    isDuplicate: boolean;
    matchingMembers: Pick<Member, 'uid' | 'displayName' | 'phoneNumber' | 'no_kta'>[];
}
