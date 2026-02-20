const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Routes for Member Feature
 * All routes are prefixed with /api/members
 */

// Public route for regional data (could be protected if desired, but usually okay as public)
router.get('/regions', memberController.getRegions);

// Protected routes
router.get('/profile', verifyToken, memberController.getProfile);
router.post('/update-profile', verifyToken, memberController.updateProfile);

module.exports = router;
