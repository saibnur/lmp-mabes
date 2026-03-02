// ──────────────────────────────────────────────────────────────────────────────
// Global Shared Types — LMP Superapp
// ──────────────────────────────────────────────────────────────────────────────

/** Region entity returned by /api/members/regions */
export interface Region {
    id: string;
    name: string;
}

/** Organization info attached to a member profile */
export interface Organization {
    level?: OrgLevel;
    province_id: string;
    province_name?: string;
    regency_id: string;
    regency_name?: string;
    district_id: string;
    district_name?: string;
    village_id: string;
    village_name?: string;
    city_id?: string;
    [key: string]: any;
}

/** Member profile as returned by /api/members/profile */
export interface MemberProfile {
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
    profileComplete?: boolean;
    organization?: Organization;
}

/** Transaction response from Midtrans payment API */
export interface TransactionResponse {
    success: boolean;
    token: string;
    snapToken?: string;
    redirect_url: string;
    orderId?: string;
}

/** Organizational hierarchy levels */
export type OrgLevel = 'daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '';

/** Step keys for the profile registration form */
export type ProfileStep = 'data-diri' | 'alamat' | 'kepengurusan' | 'preview';

/** API response wrapper */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

/** Auth API specific types */
export interface OtpResponse {
    success: boolean;
    message: string;
    devOtp?: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    customToken?: string;
    uid?: string;
    needsPassword?: boolean;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    customToken?: string;
    uid?: string;
}

/** Cloudinary signed upload params */
export interface CloudinarySignature {
    success: boolean;
    signature: string;
    timestamp: number;
    cloud_name: string;
    api_key: string;
    upload_preset: string;
}

/** A news article stored in Firestore 'berita' collection (LEGACY) */
export interface BeritaArticle {
    id?: string;
    title: string;
    content: string;        // HTML dari Tiptap editor
    headerImage: string;    // Cloudinary URL
    excerpt: string;        // Auto-generated plain text snippet
    authorId: string;
    authorName: string;
    authorRole: 'member' | 'admin';
    category: string;
    status: 'draft' | 'published';
    createdAt: any;         // Firestore Timestamp
    updatedAt: any;
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
