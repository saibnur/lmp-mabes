// ──────────────────────────────────────────────────────────────────────────────
// DEPRECATED — backwards-compat barrel.
// New code should import from '@/lib/api/auth.api', '@/lib/api/member.api', etc.
// ──────────────────────────────────────────────────────────────────────────────
export { apiClient } from '@/lib/api/client';
export { authApi } from '@/lib/api/auth.api';
export { memberApi } from '@/lib/api/member.api';
export { paymentApi } from '@/lib/api/payment.api';
export { mediaApi } from '@/lib/api/media.api';
export { normalizePhoneIndonesia } from '@/lib/utils';
