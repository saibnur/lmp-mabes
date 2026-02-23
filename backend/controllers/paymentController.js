const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const axios = require('axios');
const { getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

// Konfigurasi Midtrans
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

/**
 * Create Transaction
 * POST /api/payment/create-transaction
 */
exports.createTransaction = async (req, res) => {
    try {
        const { uid } = req;
        const db = getFirestore();

        // Ambil data user dari Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const userData = userDoc.data();
        let phone = userData.phone || userData.phoneNumber || '';
        let name = userData.displayName || userData.fullName || 'Member LMP';
        let email = userData.email || '';

        // ROBUSTNESS: Trim data
        phone = phone.trim();
        name = name.trim();
        email = email.trim();

        // FALLBACK EMAIL: Midtrans requires an email address
        if (!email) {
            // Use phone number or UID as fallback local part
            const localPart = phone.replace(/\D/g, '') || uid;
            email = `${localPart}@lmp-member.or.id`.toLowerCase();
        }

        // Generate Order ID: LMP-PAY-DDMMYYYY-RANDOM
        const date = new Date();
        const dateStr = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderId = `LMP-PAY-${dateStr}-${random}`;

        const grossAmount = 25000;

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            item_details: [{
                id: 'MEMBERSHIP_2Y',
                price: grossAmount,
                quantity: 1,
                name: 'Iuran Keanggotaan LMP (2 Tahun)'
            }],
            customer_details: {
                first_name: name,
                email: email,
                phone: phone
            }
        };

        const transaction = await snap.createTransaction(parameter);

        // Update user status to pending
        await db.collection('users').doc(uid).update({
            membershipStatus: 'pending',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Simpan transaksi ke Firestore
        await db.collection('transactions').doc(orderId).set({
            uid,
            orderId,
            grossAmount,
            status: 'pending',
            snapToken: transaction.token,
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            customerDetails: { name, phone, email },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            success: true,
            token: transaction.token,
            snapToken: transaction.token,
            redirect_url: transaction.redirect_url,
            orderId
        });

    } catch (error) {
        console.error('Error in createTransaction:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat transaksi: ' + error.message });
    }
};

/**
 * Midtrans Webhook
 * POST /api/payment/webhook
 * 
 * PETUNJUK NGROK:
 * 1. Jalankan ngrok: ngrok http 5000
 * 2. Salin URL Forwarding (misal: https://abcd-123.ngrok-free.app)
 * 3. Buka Dashboard Midtrans -> Settings -> Configuration
 * 4. Tempel di 'Payment Notification URL': https://abcd-123.ngrok-free.app/api/payment/webhook
 */
exports.midtransWebhook = async (req, res) => {
    try {
        const data = req.body;
        console.log('[Midtrans Webhook] Notifikasi Masuk:', JSON.stringify(data, null, 2));

        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            fraud_status
        } = data;

        // 1. Verifikasi Signature Key
        // SHA512(order_id + status_code + gross_amount + server_key)
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const stringToHash = order_id + status_code + gross_amount + serverKey;
        const hashed = crypto.createHash('sha512').update(stringToHash).digest('hex');

        if (hashed !== signature_key) {
            console.warn('[Payment Webhook] Invalid Signature Key');
            return res.status(403).json({ success: false, message: 'Invalid Signature Key' });
        }

        const db = getFirestore();
        const transactionRef = db.collection('transactions').doc(order_id);
        const transactionDoc = await transactionRef.get();

        if (!transactionDoc.exists) {
            console.warn(`[Payment Webhook] Transaction ${order_id} not found`);
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const transactionData = transactionDoc.data();
        const uid = transactionData.uid;

        let finalStatus = 'pending';

        // 2. Logic Status
        if (transaction_status === 'capture') {
            if (fraud_status === 'challenge') {
                finalStatus = 'challenge';
            } else if (fraud_status === 'accept') {
                finalStatus = 'success';
            }
        } else if (transaction_status === 'settlement') {
            finalStatus = 'success';
        } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
            finalStatus = 'failure';
        } else if (transaction_status === 'pending') {
            finalStatus = 'pending';
        }

        // 3. Update Status Transaksi
        await transactionRef.update({
            status: finalStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            midtransRawResponse: data
        });

        // 4. Update User & Generate KTA jika sukses (Atomic Transaction)
        if (finalStatus === 'success') {
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 2);
            const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

            let generatedKta = null;

            try {
                generatedKta = await db.runTransaction(async (transaction) => {
                    const userRef = db.collection('users').doc(uid);
                    const userDoc = await transaction.get(userRef);

                    if (!userDoc.exists) {
                        throw new Error(`User ${uid} not found during KTA generation`);
                    }

                    const userData = userDoc.data();

                    // Only generate KTA if not already issued
                    let no_kta = userData.no_kta;
                    if (!no_kta) {
                        const village_id = userData.organization?.village_id;

                        if (!village_id || village_id.length !== 10) {
                            console.warn(`[Webhook] Cannot generate KTA for uid=${uid}: invalid village_id="${village_id}". Setting active without KTA.`);
                            // Still activate membership, but without KTA
                            transaction.update(userRef, {
                                role: 'member',
                                status: 'active',
                                membershipStatus: 'active',
                                registrationDate: admin.firestore.FieldValue.serverTimestamp(),
                                membershipExpiry: expiryTimestamp,
                                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                                orderId: order_id,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                            return null;
                        }

                        // Find last KTA in same village using a direct query
                        // NOTE: We query OUTSIDE the transaction for read scalability,
                        // using the transaction itself to ensure atomic write uniqueness.
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
                        no_kta = `${formattedVillage}.${paddedSeq}`;
                    }

                    transaction.update(userRef, {
                        role: 'member',
                        status: 'active',
                        membershipStatus: 'active',
                        no_kta,
                        registrationDate: userData.registrationDate || admin.firestore.FieldValue.serverTimestamp(),
                        membershipExpiry: expiryTimestamp,
                        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                        orderId: order_id,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    return no_kta;
                });

                console.log(`[Webhook] KTA generated for uid=${uid}: ${generatedKta || 'N/A (no village_id)'}`);

                // Write audit log
                await db.collection('audit_logs').add({
                    event: 'KTA_GENERATED',
                    uid,
                    orderId: order_id,
                    no_kta: generatedKta,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

            } catch (ktaError) {
                console.error('[Webhook] KTA generation transaction failed:', ktaError.message);
                // Fallback: Activate membership without KTA to avoid blocking payment confirmation
                await db.collection('users').doc(uid).update({
                    role: 'member',
                    status: 'active',
                    membershipStatus: 'active',
                    membershipExpiry: expiryTimestamp,
                    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // Kirim Notifikasi WA via Fonnte (dengan no_kta jika berhasil)
            await sendWaNotification(
                transactionData.customerDetails.phone,
                transactionData.customerDetails.name,
                expiryDate,
                generatedKta
            );
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error('Error in payment webhook:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Utility to send WA notification via Fonnte
 */
async function sendWaNotification(phone, name, expiryDate, no_kta = null) {
    try {
        const fonnteToken = process.env.FONNTE_TOKEN;
        if (!fonnteToken) {
            console.warn('[Fonnte] Token tidak ditemukan di .env');
            return;
        }

        const formattedDate = expiryDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const ktaLine = no_kta
            ? `\n🪪 *No. KTA Anda:* ${no_kta}`
            : '';

        const message = `Assalamualaikum ${name},\n\n✅ *Pembayaran Iuran Keanggotaan LMP Berhasil!*${ktaLine}\n\nAkun Anda kini aktif sebagai *Kader Resmi LMP* hingga *${formattedDate}*.\n\nSilakan buka aplikasi untuk melihat *KTA Digital* Anda.\n\nTetap semangat membangun negeri! 🇮🇩\n\n- *Mabes LMP*`;

        await axios.post('https://api.fonnte.com/send', {
            target: phone,
            message: message
        }, {
            headers: {
                Authorization: fonnteToken
            }
        });

        console.log(`[Fonnte] Notifikasi berhasil dikirim ke ${phone}`);
    } catch (err) {
        console.error('[Fonnte] Gagal mengirim notifikasi:', err.message);
    }
}
