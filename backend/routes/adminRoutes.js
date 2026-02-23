const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/adminMiddleware');

/**
 * Routes for Admin Dashboard
 * All routes are prefixed with /api/admin
 * All routes require admin authentication
 */

// Members
router.get('/members', verifyAdmin, adminController.getAllMembers);
router.put('/members/:uid/role', verifyAdmin, adminController.updateMemberRole);

// Stats
router.get('/stats', verifyAdmin, adminController.getStats);

// NIK Verification
router.get('/verify-nik', verifyAdmin, adminController.checkNikDuplicates);

// News CMS
router.get('/news', verifyAdmin, adminController.getNews);
router.post('/news', verifyAdmin, adminController.createNews);
router.put('/news/:id', verifyAdmin, adminController.updateNews);
router.delete('/news/:id', verifyAdmin, adminController.deleteNews);

module.exports = router;
