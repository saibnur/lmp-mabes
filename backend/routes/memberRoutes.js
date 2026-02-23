const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Routes for Member Feature
 * All routes are prefixed with /api/members
 */

// Public route for regional data
router.get('/regions', memberController.getRegions);

// NIK duplicate check (protected - user must be logged in to check)
// NOTE: POST method so NIK is sent in body, not exposed in URL/query string
router.post('/check-nik', verifyToken, memberController.checkNik);

// Protected routes
router.get('/profile', verifyToken, memberController.getProfile);
router.post('/update-profile', verifyToken, memberController.updateProfile);

module.exports = router;
