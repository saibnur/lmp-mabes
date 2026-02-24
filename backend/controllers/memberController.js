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

        // RUN ATOMIC TRANSACTION FOR KTA GENERATION & PROFILE UPDATE
        let generatedKta = userData.no_kta || null;

        await db.runTransaction(async (transaction) => {
            // Re-read user doc inside transaction to ensure atomic consistency
            const txUserDoc = await transaction.get(userRef);
            if (!txUserDoc.exists) {
                throw new Error('User tidak ditemukan saat update profil');
            }

            const txUserData = txUserDoc.data();

            // ONLY generate KTA if not already issued
            if (!txUserData.no_kta) {
                const village_id = organization.village_id;

                if (!village_id || village_id.length !== 10) {
                    throw new Error(`Data wilayah tidak valid (village_id: ${village_id})`);
                }

                // Query for the latest KTA sequence in the same village OUTSIDE the transaction for scalability
                // The transaction simply prevents concurrent writes to this user doc but does not lock the entire collection
                // Since this uses sequential incremental numbering, we'll fetch the highest sequence.
                const villageUsersSnap = await db.collection('users')
                    .where('organization.village_id', '==', village_id)
                    .where('no_kta', '!=', null)
                    .orderBy('no_kta', 'desc')
                    .limit(1)
                    .get();

                let sequence = 1;
                if (!villageUsersSnap.empty) {
                    const lastKta = villageUsersSnap.docs[0].data().no_kta;
                    if (lastKta && lastKta.includes('.')) {
                        const parts = lastKta.split('.');
                        const lastSeq = parseInt(parts[parts.length - 1], 10);
                        if (!isNaN(lastSeq)) {
                            sequence = lastSeq + 1;
                        }
                    }
                }

                const paddedSeq = sequence.toString().padStart(4, '0');
                const v = village_id;
                const formattedVillage = `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4, 6)}.${v.slice(6)}`;
                generatedKta = `${formattedVillage}.${paddedSeq}`;

                // Write audit log inside transaction isn't currently supported by Firestore node SDK unless we pass the ref.
                // We'll write it outside the transaction below, which is acceptable since it's just an audit record.
            }

            const updatePayload = {
                displayName: fullName.trim(),
                nik,
                email: email || txUserData.email || '',
                phoneNumber: phoneNumber || txUserData.phoneNumber || '',
                photoURL: photoURL || txUserData.photoURL || '',
                ktpURL: ktpURL || txUserData.ktpURL || '',
                no_kta: generatedKta, // newly generated or existing
                organization: {
                    ...organization,
                    updatedAt: new Date().toISOString()
                },
                profileComplete: true,
                updatedAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
            };

            transaction.update(userRef, updatePayload);
        });

        // Write audit logs outside the transaction
        if (!userData.no_kta && generatedKta) {
            await db.collection('audit_logs').add({
                event: 'KTA_GENERATED',
                uid: req.uid,
                context: 'early_step_2_registration',
                no_kta: generatedKta,
                timestamp: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
            });
        }

        await db.collection('audit_logs').add({
            event: 'PROFILE_UPDATED',
            uid: req.uid,
            timestamp: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            success: true,
            message: 'Profil berhasil disimpan dan nomor KTA telah dibuat. Lanjutkan ke pembayaran untuk aktivasi layar KTA.',
            data: {
                ...userData,
                displayName: fullName.trim(),
                nik,
                no_kta: generatedKta,
                uid: req.uid
            }
        });
    } catch (error) {
        console.error('[MemberController] Update profile & generate KTA error:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal memperbarui profil dan KTA' });
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
