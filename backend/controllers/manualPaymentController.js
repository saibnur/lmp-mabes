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

// ─────────────────────────────────────────────────────────────────────────────
// GAP #3 FIX: Expire order yang sudah lewat 24 jam (status 'pending' saja).
// Dipanggil setiap kali user generate order baru.
// ─────────────────────────────────────────────────────────────────────────────
async function expireStaleOrders(db) {
    try {
        const now = admin.firestore.Timestamp.now();
        const stale = await db.collection('payment_confirmations')
            .where('status', '==', 'pending')
            .where('expiredAt', '<', now)
            .get();
        if (stale.empty) return;
        const batch = db.batch();
        stale.docs.forEach(doc => {
            batch.update(doc.ref, {
                status: 'expired',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        console.log(`[Manual Payment] Expired ${stale.size} stale order(s).`);
    } catch (err) {
        // Jangan gagalkan request utama hanya karena expire check error
        console.warn('[Manual Payment] expireStaleOrders warning:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAP #1 FIX: Scope cek konflik per hari (bukan global).
// GAP #2 FIX: Max 10 percobaan, pesan error sesuai spec.
// GAP #3 FIX: Status 'expired' tidak dianggap konflik (hanya pending & submitted hari ini).
// ─────────────────────────────────────────────────────────────────────────────
async function generateUniqueCode(db) {
    // Hitung batas awal hari ini (WIB = UTC+7 → offset 7 jam)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTs = admin.firestore.Timestamp.fromDate(todayStart);

    // GAP #2: max 10x sesuai spec
    const MAX_ATTEMPTS = 10;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const code = Math.floor(Math.random() * 999) + 1; // 1–999

        // GAP #1: scope per hari + hanya cek status aktif (bukan expired/approved/rejected)
        const existing = await db.collection('payment_confirmations')
            .where('uniqueCode', '==', code)
            .where('status', 'in', ['pending', 'submitted'])
            .where('createdAt', '>=', todayStartTs)
            .limit(1)
            .get();

        if (existing.empty) {
            return code;
        }
    }
    // GAP #2: pesan error sesuai spec
    throw new Error('Slot penuh, coba beberapa saat lagi');
}

/**
 * POST /api/payment/manual/create-order
 * Buat manual order dan kembalikan info rekening bank + kode unik.
 * Private — butuh verifyToken.
 */
exports.createManualOrder = async (req, res) => {
    try {
        const { uid } = req;
        const db = getFirestore();

        // GAP #3: Expire order lama sebelum generate kode baru
        await expireStaleOrders(db);

        // GAP #4: Cek pending & submitted — jangan buat duplikat jika sudah ada salah satunya
        const existing = await db.collection('payment_confirmations')
            .where('uid', '==', uid)
            .where('status', 'in', ['pending', 'submitted'])
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        let orderId;
        let uniqueCode;
        let grossAmount;
        let expiredAt;

        if (!existing.empty) {
            // Gunakan order yang sudah ada — kembalikan data dari DB
            const existingData = existing.docs[0].data();
            orderId = existing.docs[0].id;
            uniqueCode = existingData.uniqueCode;
            grossAmount = existingData.grossAmount;
            // GAP #3: kembalikan expiredAt jika ada
            expiredAt = existingData.expiredAt?.toDate?.()?.toISOString() || null;
        } else {
            // Buat order baru
            const date = new Date();
            const dateStr = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            orderId = `LMP-MANUAL-${dateStr}-${random}`;

            // Ambil data user
            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            // Generate kode unik (scope per hari, max 10x)
            uniqueCode = await generateUniqueCode(db);
            grossAmount = MEMBERSHIP_AMOUNT + uniqueCode;

            // GAP #3: expiredAt = sekarang + 24 jam
            const expiredAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const expiredAtTs = admin.firestore.Timestamp.fromDate(expiredAtDate);
            expiredAt = expiredAtDate.toISOString();

            await db.collection('payment_confirmations').doc(orderId).set({
                uid,
                orderId,
                grossAmount,
                uniqueCode,
                baseAmount: MEMBERSHIP_AMOUNT,
                status: 'pending',
                expiredAt: expiredAtTs,           // GAP #3: simpan expiredAt
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

        res.status(200).json({
            success: true,
            orderId,
            uniqueCode,
            amount: grossAmount,
            baseAmount: MEMBERSHIP_AMOUNT,
            expiredAt,          // GAP #3 & #6: kirim ke frontend agar ditampilkan
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
        const orderData = orderDoc.data();
        if (orderData.uid !== uid) {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }
        if (orderData.status !== 'pending') {
            return res.status(409).json({ success: false, message: 'Order sudah dikonfirmasi atau tidak aktif.' });
        }
        // Cek apakah sudah expired
        if (orderData.expiredAt && orderData.expiredAt.toDate() < new Date()) {
            await db.collection('payment_confirmations').doc(orderId).update({
                status: 'expired',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return res.status(410).json({ success: false, message: 'Order sudah kadaluarsa. Silakan buat order baru.' });
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
                    max_bytes: 5 * 1024 * 1024,
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
 * Query param: status, search
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
            expiredAt: doc.data().expiredAt?.toDate?.()?.toISOString() || null,
            confirmation: doc.data().confirmation
                ? {
                    ...doc.data().confirmation,
                    submittedAt: doc.data().confirmation?.submittedAt?.toDate?.()?.toISOString() || null,
                }
                : null,
        }));

        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            confirmations = confirmations.filter(c => {
                const name = (c.customerDetails?.name || '').toLowerCase();
                const email = (c.customerDetails?.email || '').toLowerCase();
                return name.includes(q) || email.includes(q);
            });
        }

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

        if (action === 'reject' && (!reason || !reason.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Alasan penolakan wajib diisi.',
            });
        }

        const orderDoc = await db.collection('payment_confirmations').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
        }

        const orderData = orderDoc.data();
        const uid = orderData.uid;

        if (action === 'approve') {
            await db.collection('payment_confirmations').doc(orderId).update({
                status: 'approved',
                adminNote: reason || '',
                approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

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
                adminNote: reason.trim(),
                rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await db.collection('users').doc(uid).update({
                membershipStatus: 'pending',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`[Manual Payment] Order ${orderId} REJECTED. Reason: ${reason}`);

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
                expiredAt: data.expiredAt?.toDate?.()?.toISOString() || null,
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
