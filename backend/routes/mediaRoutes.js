const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { verifyToken } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/media/sign-upload
 * Generate signature for secure Cloudinary upload from client
 */
router.get('/sign-upload', verifyToken, (req, res) => {
    try {
        const folder = req.query.folder || 'members';
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'LMPweb',
                folder: folder,
            },
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            success: true,
            signature,
            timestamp,
            folder,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'LMPweb',
        });
    } catch (error) {
        console.error('Cloudinary signature error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat signature media' });
    }
});

module.exports = router;
