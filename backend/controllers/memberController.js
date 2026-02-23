const { getFirestore, getFirebaseAdmin } = require('../config/firebase');
const regionalService = require('../services/regionalService');

const db = getFirestore();

/**
 * Controller for Member/Profile related operations
 */

// GET /api/members/regions
exports.getRegions = async (req, res) => {
    const { type, parent_id } = req.query;

    try {
        let data = [];
        if (type === 'provinces') {
            data = await regionalService.getProvinces();
        } else if (type === 'regencies' && parent_id) {
            data = await regionalService.getRegencies(parent_id);
        } else if (type === 'districts' && parent_id) {
            data = await regionalService.getDistricts(parent_id);
        } else if (type === 'villages' && parent_id) {
            data = await regionalService.getVillages(parent_id);
        } else {
            return res.status(400).json({ success: false, message: 'Type or parent_id missing' });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(`[MemberController] Error fetching ${type}:`, error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil data wilayah' });
    }
};

// POST /api/members/check-nik
// Body: { nik } — used for real-time NIK duplicate check on the frontend
// Using POST so NIK is never exposed in the URL/query string
exports.checkNik = async (req, res) => {
    const { nik } = req.body;

    if (!nik || nik.length !== 16) {
        return res.status(400).json({ success: false, message: 'NIK tidak valid (harus 16 digit)' });
    }

    try {
        const snapshot = await db.collection('users')
            .where('nik', '==', nik)
            .limit(1)
            .get();

        // If found AND it belongs to a different user, it's a duplicate
        const isDuplicate = !snapshot.empty && snapshot.docs[0].id !== req.uid;

        res.status(200).json({ success: true, exists: isDuplicate });
    } catch (error) {
        console.error('[MemberController] Check NIK error:', error.message);
        res.status(500).json({ success: false, message: 'Gagal memeriksa NIK' });
    }
};

// POST /api/members/update-profile
// NOTE: KTA no_kta is generated ONLY via the payment webhook (paymentController.js).
// This endpoint only saves profile data. If a user already has a no_kta, it is preserved.
exports.updateProfile = async (req, res) => {
    const {
        fullName,
        nik,
        email,
        phoneNumber,
        organization,
        photoURL,
        ktpURL
    } = req.body;

    if (!fullName || !fullName.trim()) {
        return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });
    }

    if (!nik || nik.length !== 16) {
        return res.status(400).json({ success: false, message: 'NIK wajib 16 digit' });
    }

    if (!organization || !organization.village_id) {
        return res.status(400).json({ success: false, message: 'Data Wilayah Desa wajib diisi sebelum menyimpan profil' });
    }

    const userRef = db.collection('users').doc(req.uid);

    try {
        // NIK duplicate check — fail if another user has the same NIK
        const nikSnapshot = await db.collection('users')
            .where('nik', '==', nik)
            .limit(2)
            .get();

        for (const doc of nikSnapshot.docs) {
            if (doc.id !== req.uid) {
                return res.status(409).json({
                    success: false,
                    message: 'NIK sudah terdaftar di akun lain. Hubungi Mabes jika Anda merasa ini kesalahan.'
                });
            }
        }

        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const userData = userDoc.data();

        const updatePayload = {
            displayName: fullName.trim(),
            nik,
            email: email || userData.email || '',
            phoneNumber: phoneNumber || userData.phoneNumber || '',
            photoURL: photoURL || userData.photoURL || '',
            ktpURL: ktpURL || userData.ktpURL || '',
            // Preserve existing no_kta (only payment webhook can set this)
            organization: {
                ...organization,
                updatedAt: new Date().toISOString()
            },
            profileComplete: true,
            updatedAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
        };

        await userRef.update(updatePayload);

        // Write audit log
        await db.collection('audit_logs').add({
            event: 'PROFILE_UPDATED',
            uid: req.uid,
            timestamp: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            success: true,
            message: 'Profil berhasil disimpan. Lanjutkan ke pembayaran untuk menerima KTA.',
            data: { ...userData, ...updatePayload, uid: req.uid }
        });
    } catch (error) {
        console.error('[MemberController] Update profile error:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui profil' });
    }
};

// GET /api/members/profile
exports.getProfile = async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
        }
        res.status(200).json({ success: true, data: userDoc.data() });
    } catch (error) {
        console.error('[MemberController] Get profile error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data profil' });
    }
};
