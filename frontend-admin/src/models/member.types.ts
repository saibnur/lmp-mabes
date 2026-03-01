export interface Organization {
    level?: 'pusat' | 'daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '';
    province_id?: string;
    province_name?: string;
    // Lama (tidak ada di data):
    city_id?: string;
    city_name?: string;
    // Tambah field yang sebenarnya ada:
    regency_id?: string;
    regency_name?: string;
    district_id?: string;
    district_name?: string;
    village_id?: string;
    village_name?: string;
    updatedAt?: string;
}

export interface Kepengurusan {
    level: 'pusat' | 'provinsi' | 'kab_kota' | 'kecamatan' | 'kelurahan';
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

/** Satu titik data untuk grafik — dikembalikan backend sudah diagregasi */
export interface RegistrationDataPoint {
    label: string;   // sumbu X: nama hari / rentang minggu / bulan / tahun
    active: number;
    pending: number;
}

/** Response dari GET /api/admin/stats */
export interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    expiredMembers: number;
    totalAdmins: number;
    /** Sudah diagregasi backend sesuai `range` yang dikirim */
    registrationData: RegistrationDataPoint[];
}

/**
 * daily   → 7 hari terakhir      (sumbu X: Sen, Sel, ...)
 * weekly  → 8 minggu terakhir    (sumbu X: 01-07 Jan, ...)
 * monthly → 12 bulan terakhir    (sumbu X: Jan, Feb, ...)
 * yearly  → 5 tahun terakhir     (sumbu X: 2022, 2023, ...)
 */
export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BeritaArticle {
    id?: string;
    title: string;
    content: string;
    headerImage: string;
    excerpt: string;
    authorId: string;
    authorName: string;
    authorRole: 'member' | 'admin';
    category: string;
    status: 'draft' | 'published';
    createdAt: any;
    updatedAt: any;
}

export interface NikCheckResult {
    nik: string;
    isDuplicate: boolean;
    matchingMembers: Pick<Member, 'uid' | 'displayName' | 'phoneNumber' | 'no_kta'>[];
}