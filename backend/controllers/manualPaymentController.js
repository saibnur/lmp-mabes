const { getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const Busboy = require('busboy');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Info rekening bank tujuan transfer ───────────────────────────────────────
// FIX: array sebelumnya salah tutup (syntax error). Hanya BRI sesuai spec.
const BANK_ACCOUNTS = [
    {
        bank: 'BRI',
        accountNumber: '117701000384569',
        accountName: 'Perkumpulan Ormas Laskar Merah Putih',
    },
];

const MEMBERSHIP_AMOUNT = 25000;

/**
 * GET /api/payment/mode
 * Kembalikan mode pembayaran saat ini. Public endpoint.
 */
exports.getPaymentMode = (req, res) => {
    res.json({ success: true, mode: process.env.PAYMENT_MODE || 'midtrans' });
};

/**
 * Generate kode unik 3 digit (001–999) yang tidak bentrok dengan transaksi pending lain.
 * FIX: Sebelumnya hanya Math.random() tanpa collision check.
 */
async function generateUniqueCode(db) {
    const MAX_ATTEMPTS = 20;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const code = Math.floor(Math.random() * 999) + 1; // 1–999
        // Cek apakah sudah ada pending dengan kode unik ini
        const existing = await db.collection('payment_confirmations')
            .where('uniqueCode', '==', code)
            .where('status', 'in', ['pending', 'submitted'])
            .limit(1)
            .get();
        if (existing.empty) {
            return code;
        }
    }
    // Fallback: jika 20x masih bentrok (sangat jarang), lempar error
    throw new Error('Tidak dapat generate kode unik. Coba lagi nanti.');
}

/**
 * POST /api/payment/manual/create-order
 * Buat manual order dan kembalikan info rekening bank.
 * Private — butuh verifyToken.
 */
exports.createManualOrder = async (req, res) => {
    try {
        const { uid } = req;
        const db = getFirestore();

        // Cek apakah sudah ada pending order yang belum dikonfirmasi
        const existing = await db.collection('payment_confirmations')
            .where('uid', '==', uid)
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        let orderId;
        let uniqueCode;
        let grossAmount;

        if (!existing.empty) {
            // Gunakan order yang sudah ada — kembalikan data dari DB
            const existingData = existing.docs[0].data();
            orderId = existing.docs[0].id;
            uniqueCode = existingData.uniqueCode;
            grossAmount = existingData.grossAmount;
        } else {
            // Buat order baru
            const date = new Date();
            const dateStr = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            orderId = `LMP-MANUAL-${dateStr}-${random}`;

            // Ambil data user
            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            // FIX: Generate kode unik dengan collision check
            uniqueCode = await generateUniqueCode(db);
            grossAmount = MEMBERSHIP_AMOUNT + uniqueCode;

            await db.collection('payment_confirmations').doc(orderId).set({
                uid,
                orderId,
                grossAmount,
                uniqueCode,
                baseAmount: MEMBERSHIP_AMOUNT,
                status: 'pending',
                customerDetails: {
                    name: userData.displayName || userData.fullName || '',
                    phone: userData.phone || userData.phoneNumber || '',
                    email: userData.email || '',
                },
                bankAccounts: BANK_ACCOUNTS,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update user ke pending
            await db.collection('users').doc(uid).update({
                membershipStatus: 'pending',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // FIX: Kembalikan uniqueCode & grossAmount dari DB, bukan generate ulang
        res.status(200).json({
            success: true,
            orderId,
            uniqueCode,
            amount: grossAmount,
            baseAmount: MEMBERSHIP_AMOUNT,
            bankAccounts: BANK_ACCOUNTS,
        });
    } catch (error) {
        console.error('[Manual Payment] createManualOrder error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat order: ' + error.message });
    }
};

/**
 * POST /api/payment/manual/confirm
 * User kirim konfirmasi transfer.
 * Body: { orderId, buktiUrl? }
 * Private — butuh verifyToken.
 */
exports.submitConfirmation = async (req, res) => {
    try {
        const { uid } = req;
        const db = getFirestore();

        const { orderId, buktiUrl: bodyBuktiUrl } = req.body;
        const buktiUrl = bodyBuktiUrl || req.buktiUrl || null;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'orderId wajib diisi.',
            });
        }

        // Verifikasi order milik user ini
        const orderDoc = await db.collection('payment_confirmations').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
        }
        if (orderDoc.data().uid !== uid) {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }
        if (orderDoc.data().status !== 'pending') {
            return res.status(409).json({ success: false, message: 'Order sudah dikonfirmasi sebelumnya.' });
        }

        await db.collection('payment_confirmations').doc(orderId).update({
            status: 'submitted',
            confirmation: {
                buktiUrl: buktiUrl || null,
                submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({
            success: true,
            message: 'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi admin.',
        });
    } catch (error) {
        console.error('[Manual Payment] submitConfirmation error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim konfirmasi: ' + error.message });
    }
};

/**
 * POST /api/payment/manual/upload-bukti
 * Upload foto bukti transfer ke Cloudinary. Kembalikan URL.
 * Body: multipart/form-data dengan field 'bukti' (file).
 * Private — butuh verifyToken.
 */
exports.uploadBukti = async (req, res) => {
    try {
        const busboy = Busboy({ headers: req.headers });
        let uploadResult = null;
        let uploadError = null;

        busboy.on('file', (fieldname, fileStream, info) => {
            if (fieldname !== 'bukti') {
                fileStream.resume();
                return;
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'payment-proofs',
                    resource_type: 'image',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                    max_bytes: 5 * 1024 * 1024, // 5 MB
                },
                (error, result) => {
                    if (error) {
                        console.error('[Cloudinary] Upload error:', error);
                        uploadError = error;
                    } else {
                        uploadResult = result;
                    }
                }
            );

            fileStream.pipe(uploadStream);
        });

        busboy.on('finish', () => {
            if (uploadError) {
                return res.status(500).json({ success: false, message: 'Gagal mengupload file ke Cloudinary.' });
            }
            if (uploadResult) {
                res.status(200).json({
                    success: true,
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                });
            } else {
                res.status(400).json({ success: false, message: 'Tidak ada file yang diterima. Pastikan field bernama "bukti".' });
            }
        });

        busboy.on('error', (err) => {
            console.error('[Busboy] Error:', err);
            res.status(500).json({ success: false, message: 'Gagal memproses file.' });
        });

        req.pipe(busboy);
    } catch (error) {
        console.error('[Manual Payment] uploadBukti error:', error);
        res.status(500).json({ success: false, message: 'Gagal upload: ' + error.message });
    }
};

/**
 * GET /api/payment/manual/pending
 * Admin: daftar semua konfirmasi manual (semua status).
 * Query param: status (pending | submitted | approved | rejected)
 * Private — butuh verifyToken (admin).
 */
exports.getPendingConfirmations = async (req, res) => {
    try {
        const db = getFirestore();
        const { status, search } = req.query;

        let query = db.collection('payment_confirmations')
            .orderBy('updatedAt', 'desc')
            .limit(200);

        if (status) {
            query = db.collection('payment_confirmations')
                .where('status', '==', status)
                .orderBy('updatedAt', 'desc')
                .limit(200);
        }

        const snapshot = await query.get();
        let confirmations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
            confirmation: doc.data().confirmation
                ? {
                    ...doc.data().confirmation,
                    submittedAt: doc.data().confirmation?.submittedAt?.toDate?.()?.toISOString() || null,
                }
                : null,
        }));

        // Filter search (nama / email) — dilakukan di backend untuk simplisitas
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            confirmations = confirmations.filter(c => {
                const name = (c.customerDetails?.name || '').toLowerCase();
                const email = (c.customerDetails?.email || '').toLowerCase();
                return name.includes(q) || email.includes(q);
            });
        }

        // Hitung pending count untuk badge
        const pendingCount = await db.collection('payment_confirmations')
            .where('status', '==', 'submitted')
            .get()
            .then(s => s.size)
            .catch(() => 0);

        res.status(200).json({ success: true, data: confirmations, pendingCount });
    } catch (error) {
        console.error('[Manual Payment] getPendingConfirmations error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data: ' + error.message });
    }
};

/**
 * GET /api/payment/manual/pending-count
 * Cepat ambil jumlah konfirmasi yang menunggu verifikasi admin.
 * Private — butuh verifyToken (admin).
 */
exports.getPendingCount = async (req, res) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('payment_confirmations')
            .where('status', '==', 'submitted')
            .get();
        res.status(200).json({ success: true, count: snapshot.size });
    } catch (error) {
        console.error('[Manual Payment] getPendingCount error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil jumlah: ' + error.message });
    }
};

/**
 * POST /api/payment/manual/approve
 * Admin: approve atau reject pembayaran manual.
 * Body: { orderId, action: 'approve' | 'reject', reason?: string }
 * Private — butuh verifyToken (admin).
 */
exports.approveOrRejectPayment = async (req, res) => {
    try {
        const db = getFirestore();
        const { orderId, action, reason } = req.body;

        if (!orderId || !action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "orderId dan action ('approve' | 'reject') wajib diisi.",
            });
        }

        const orderDoc = await db.collection('payment_confirmations').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
        }

        const orderData = orderDoc.data();
        const uid = orderData.uid;

        if (action === 'approve') {
            // 1. Update payment_confirmations
            await db.collection('payment_confirmations').doc(orderId).update({
                status: 'approved',
                adminNote: reason || '',
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 2. Aktifkan membership user (sama seperti logika Midtrans webhook)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 2);
            const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

            await db.collection('users').doc(uid).update({
                role: 'member',
                status: 'active',
                membershipStatus: 'active',
                membershipExpiry: expiryTimestamp,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                orderId: orderId,
                paymentMethod: 'manual_transfer',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 3. Buat/update dokumen di koleksi transactions untuk konsistensi
            await db.collection('transactions').doc(orderId).set({
                uid,
                orderId,
                grossAmount: orderData.grossAmount,
                uniqueCode: orderData.uniqueCode || null,
                baseAmount: orderData.baseAmount || MEMBERSHIP_AMOUNT,
                status: 'success',
                paymentMethod: 'manual_transfer',
                customerDetails: orderData.customerDetails,
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: orderData.createdAt,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            console.log(`[Manual Payment] Order ${orderId} APPROVED. Membership activated for uid=${uid}`);

            return res.status(200).json({
                success: true,
                message: 'Pembayaran disetujui. Keanggotaan user telah diaktifkan.',
            });
        }

        if (action === 'reject') {
            await db.collection('payment_confirmations').doc(orderId).update({
                status: 'rejected',
                adminNote: reason || 'Ditolak oleh admin.',
                rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Kembalikan status user ke pending supaya bisa kirim ulang
            await db.collection('users').doc(uid).update({
                membershipStatus: 'pending',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[Manual Payment] Order ${orderId} REJECTED.`);

            return res.status(200).json({
                success: true,
                message: 'Pembayaran ditolak. User dapat mengirim ulang konfirmasi.',
            });
        }
    } catch (error) {
        console.error('[Manual Payment] approveOrRejectPayment error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses: ' + error.message });
    }
};

/**
 * GET /api/payment/manual/my-status
 * User: cek status konfirmasi terakhir milik user ini.
 * Private — butuh verifyToken.
 */
exports.getMyConfirmationStatus = async (req, res) => {
    try {
        const { uid } = req;
        const db = getFirestore();

        const snapshot = await db.collection('payment_confirmations')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ success: true, data: null });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        res.status(200).json({
            success: true,
            data: {
                id: doc.id,
                orderId: data.orderId,
                status: data.status,
                grossAmount: data.grossAmount,
                uniqueCode: data.uniqueCode || null,
                baseAmount: data.baseAmount || MEMBERSHIP_AMOUNT,
                adminNote: data.adminNote || null,
                bankAccounts: BANK_ACCOUNTS,
                confirmation: data.confirmation
                    ? {
                        ...data.confirmation,
                        submittedAt: data.confirmation?.submittedAt?.toDate?.()?.toISOString() || null,
                    }
                    : null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
            },
        });
    } catch (error) {
        console.error('[Manual Payment] getMyConfirmationStatus error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil status: ' + error.message });
    }
};
