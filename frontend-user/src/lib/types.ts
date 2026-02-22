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
