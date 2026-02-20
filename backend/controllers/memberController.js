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

// POST /api/members/update-profile
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

    if (!nik || !organization || !organization.village_id) {
        return res.status(400).json({ success: false, message: 'NIK dan Data Wilayah (Desa) wajib diisi' });
    }

    const userRef = db.collection('users').doc(req.uid);

    try {
        const updatedUser = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            let no_kta = userData.no_kta;

            // Generate KTA if not exists
            if (!no_kta) {
                const village_id = organization.village_id;

                const lastUserSnapshot = await db.collection('users')
                    .where('organization.village_id', '==', village_id)
                    .orderBy('no_kta', 'desc')
                    .limit(1)
                    .get();

                let sequence = 1;
                if (!lastUserSnapshot.empty) {
                    const lastKta = lastUserSnapshot.docs[0].data().no_kta;
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
                let formattedVillage = v;
                if (v && v.length === 10) {
                    formattedVillage = `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4, 6)}.${v.slice(6)}`;
                }

                no_kta = `${formattedVillage}.${paddedSeq}`;
            }

            const updatePayload = {
                displayName: fullName,
                nik,
                email: email || userData.email || '',
                phoneNumber: phoneNumber || userData.phoneNumber || '',
                photoURL: photoURL || userData.photoURL || '',
                ktpURL: ktpURL || userData.ktpURL || '',
                no_kta,
                organization: {
                    ...organization,
                    updatedAt: new Date().toISOString()
                },
                updatedAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
            };

            transaction.update(userRef, updatePayload);
            return { ...userData, ...updatePayload, uid: req.uid };
        });

        res.status(200).json({
            success: true,
            message: 'Profil berhasil diperbarui',
            data: updatedUser
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
