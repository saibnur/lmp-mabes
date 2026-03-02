const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');
const { verifyAdmin } = require('../middleware/adminMiddleware');

/**
 * Migration Routes
 * All routes are prefixed with /api/admin/migrate
 * All routes require admin authentication
 */

router.post('/berita-to-posts', verifyAdmin, migrationController.runMigration);
router.get('/status', verifyAdmin, migrationController.getMigrationStatus);
router.post('/cleanup-assets', verifyAdmin, migrationController.cleanupOrphanedAssets);

module.exports = router;
