const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payment/create-transaction
 * @desc    Get Midtrans Snap Token
 * @access  Private (Registered Users)
 */
router.post('/create-transaction', verifyToken, paymentController.createTransaction);

/**
 * @route   POST /api/payment/webhook
 * @desc    Midtrans HTTP Notification handler
 * @access  Public (Midtrans IP only ideally, but verified via signature)
 */
router.post('/webhook', paymentController.midtransWebhook);

module.exports = router;
