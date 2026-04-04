const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const manualPaymentController = require('../controllers/manualPaymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// ─── Feature Flag: cek PAYMENT_MODE ─────────────────────────────────────────
/**
 * @route   GET /api/payment/mode
 * @desc    Kembalikan mode pembayaran aktif (manual | midtrans)
 * @access  Public
 */
router.get('/mode', manualPaymentController.getPaymentMode);

// ─── Midtrans Routes (tidak dihapus, tetap bisa diaktifkan kembali) ──────────
/**
 * @route   POST /api/payment/create-transaction
 * @desc    Get Midtrans Snap Token
 * @access  Private
 */
router.post('/create-transaction', verifyToken, paymentController.createTransaction);

/**
 * @route   POST /api/payment/webhook
 * @desc    Midtrans HTTP Notification handler
 * @access  Public (verified via signature)
 */
router.post('/webhook', paymentController.midtransWebhook);

// ─── Manual Payment Routes ────────────────────────────────────────────────────
/**
 * @route   POST /api/payment/manual/create-order
 * @desc    Buat manual order dan ambil info rekening bank
 * @access  Private
 */
router.post('/manual/create-order', verifyToken, manualPaymentController.createManualOrder);

/**
 * @route   POST /api/payment/manual/confirm
 * @desc    User kirim konfirmasi transfer
 * @access  Private
 */
router.post('/manual/confirm', verifyToken, manualPaymentController.submitConfirmation);

/**
 * @route   POST /api/payment/manual/upload-bukti
 * @desc    Upload foto bukti transfer ke Cloudinary
 * @access  Private
 */
router.post('/manual/upload-bukti', verifyToken, manualPaymentController.uploadBukti);

/**
 * @route   GET /api/payment/manual/my-status
 * @desc    User: cek status konfirmasi terakhir
 * @access  Private
 */
router.get('/manual/my-status', verifyToken, manualPaymentController.getMyConfirmationStatus);

/**
 * @route   GET /api/payment/manual/pending
 * @desc    Admin: daftar konfirmasi (query ?status=submitted|approved|rejected&search=nama)
 * @access  Private (Admin)
 */
router.get('/manual/pending', verifyToken, manualPaymentController.getPendingConfirmations);

/**
 * @route   GET /api/payment/manual/pending-count
 * @desc    Admin: jumlah konfirmasi yang menunggu verifikasi (untuk badge sidebar)
 * @access  Private (Admin)
 */
router.get('/manual/pending-count', verifyToken, manualPaymentController.getPendingCount);

/**
 * @route   POST /api/payment/manual/approve
 * @desc    Admin: approve atau reject pembayaran manual
 * @access  Private (Admin)
 */
router.post('/manual/approve', verifyToken, manualPaymentController.approveOrRejectPayment);

module.exports = router;
