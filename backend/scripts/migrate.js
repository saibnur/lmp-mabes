/**
 * Scripts/migrate.js
 * Manual entry point for the berita-to-posts migration.
 * Run this from the root: node backend/scripts/migrate.js
 */
require('dotenv').config();
const { runMigration } = require('../controllers/migrationController');

// Mock response object
const mockRes = {
    json: (data) => {
        console.log('Migration Result:', JSON.stringify(data, null, 2));
        process.exit(0);
    },
    status: (code) => ({
        json: (data) => {
            console.error(`Migration Failed (Code ${code}):`, JSON.stringify(data, null, 2));
            process.exit(1);
        }
    })
};

console.log('Starting migration...');
runMigration({}, mockRes).catch(err => {
    console.error('Fatal Migration Error:', err);
    process.exit(1);
});
