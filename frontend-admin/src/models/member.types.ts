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

// ──────────────────────────────────────────────────────────────────────────────
// News Feed Social-Media Style (posts collection, schema_version: 2)
// ──────────────────────────────────────────────────────────────────────────────

export interface PostMediaAsset {
    url: string;
    public_id: string;
    width?: number | null;
    height?: number | null;
    type?: string;
}

export interface PostMedia {
    header_image: PostMediaAsset;
    inline_assets: PostMediaAsset[];
}

export interface PostAuthor {
    uid: string;
    display_name: string;
    photo_url: string;
    role: 'admin' | 'member';
    region_id: string;
    region_name: string;
}

export interface PostVisibility {
    scope: 'national' | 'regional' | 'branch';
    region_id: string;
    region_name: string;
    region_level: string;
    visible_to_ancestors: boolean;
    visible_to_descendants: boolean;
}

export interface PostMetrics {
    like_count: number;
    comment_count: number;
    view_count: number;
    share_count: number;
}

export interface PostContent {
    html_body: string;
    excerpt: string;
    format: string;
}

export interface Post {
    id?: string;
    _schema_version: number;
    title: string;
    content: PostContent;
    media: PostMedia;
    author: PostAuthor;
    visibility: PostVisibility;
    category: string;
    tags: string[];
    status: 'draft' | 'published';
    is_pinned: boolean;
    metrics: PostMetrics;
    legacy?: {
        migrated_from: string;
        original_doc_id: string;
        migrated_at: any;
    };
    created_at: any;
    updated_at: any;
    published_at: any;
}

export interface PostComment {
    id?: string;
    author: {
        uid: string;
        display_name: string;
        photo_url: string;
        role: 'admin' | 'member';
    };
    body: string;
    body_format: string;
    parent_comment_id: string | null;
    depth: number;
    is_edited: boolean;
    is_deleted: boolean;
    like_count: number;
    created_at: any;
    updated_at: any;
}