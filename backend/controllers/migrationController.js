/**
 * migrationController.js
 * ──────────────────────────────────────────────────────────────────────────────
 * One-time migration of legacy `berita` collection → `posts` collection.
 *
 * Algorithm: MigrateBeritaToPosts (see news_feed_architecture.md §3)
 *  - batch cursor-based processing (250 docs at a time)
 *  - per-doc Firestore transaction: write to `posts/` + mark `berita` as migrated
 *  - ZERO DATA LOSS: berita docs are marked _migrated=true, NEVER deleted
 *  - audit trail saved to `_migrations` collection
 * ──────────────────────────────────────────────────────────────────────────────
 */

const { getFirestore, admin } = require('../config/firebase');

const BATCH_SIZE = 250;
const EXCERPT_MAX_LENGTH = 200;
const DEFAULT_REGION_ID = '00';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateExcerpt(htmlBody, maxLength = EXCERPT_MAX_LENGTH) {
    if (!htmlBody) return '';
    let text = htmlBody.replace(/<[^>]*>/g, '');
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) return truncated.substring(0, lastSpace) + '…';
    return truncated + '…';
}

function extractCloudinaryUrls(htmlBody) {
    if (!htmlBody) return [];
    const pattern = /https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/(?:image|video)\/upload\/[^\s"'<>]+/g;
    const matches = htmlBody.match(pattern) || [];
    return [...new Set(matches)];
}

function extractPublicId(url) {
    if (!url) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let path = parts[1];
        path = path.replace(/^v\d+\//, '');
        path = path.replace(/\.[^/.]+$/, '');
        return path || null;
    } catch {
        return null;
    }
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/admin/migrate/berita-to-posts
 * Runs the full migration. Idempotent: skips already-migrated docs.
 */
exports.runMigration = async (req, res) => {
    const db = getFirestore();
    const startTime = new Date();
    const migrationLog = [];
    const errorLog = [];
    let totalMigrated = 0;
    let totalSkipped = 0;
    let cursor = null;

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Build query: only docs NOT yet migrated
            let q = db
                .collection('berita')
                .where('_migrated', '!=', true)
                .orderBy('_migrated')        // required when using != filter
                .orderBy('createdAt', 'asc')
                .limit(BATCH_SIZE);

            if (cursor) {
                q = q.startAfter(cursor);
            }

            const snapshot = await q.get();

            if (snapshot.empty) break; // All done

            for (const beritaDoc of snapshot.docs) {
                const legacy = beritaDoc.data();
                let newPostId = null;

                try {
                    // Resolve author info
                    let authorData = null;
                    if (legacy.authorId) {
                        const authorDoc = await db.collection('users').doc(legacy.authorId).get();
                        if (authorDoc.exists) authorData = authorDoc.data();
                    }

                    const regionId = authorData?.kepengurusan?.region_id ?? DEFAULT_REGION_ID;
                    const regionName = authorData?.kepengurusan?.region_name ?? 'Nasional';
                    const regionLevel = authorData?.kepengurusan?.level ?? 'pusat';

                    const htmlBody = legacy.content || '';
                    const excerpt = generateExcerpt(htmlBody);
                    const inlineUrls = extractCloudinaryUrls(htmlBody);

                    const newPost = {
                        _schema_version: 2,
                        title: legacy.title || 'Untitled',
                        content: {
                            html_body: htmlBody,
                            excerpt,
                            format: 'tiptap_html',
                        },
                        media: {
                            header_image: {
                                url: legacy.headerImage || '',
                                public_id: extractPublicId(legacy.headerImage) || '',
                                width: null,
                                height: null,
                            },
                            inline_assets: inlineUrls.map((url) => ({
                                url,
                                public_id: extractPublicId(url) || '',
                                type: 'image',
                            })),
                        },
                        author: {
                            uid: legacy.authorId || '',
                            display_name:
                                legacy.authorName || authorData?.displayName || 'Anggota LMP',
                            photo_url: authorData?.photoURL || '',
                            role: legacy.authorRole || 'member',
                            region_id: regionId,
                            region_name: regionName,
                        },
                        visibility: {
                            scope: regionId === DEFAULT_REGION_ID ? 'national' : 'regional',
                            region_id: regionId,
                            region_name: regionName,
                            region_level: regionLevel,
                            visible_to_ancestors: true,
                            visible_to_descendants: true,
                        },
                        category: legacy.category || 'berita',
                        tags: [],
                        status: legacy.status || 'published',
                        is_pinned: false,
                        metrics: {
                            like_count: 0,
                            comment_count: 0,
                            view_count: 0,
                            share_count: 0,
                        },
                        legacy: {
                            migrated_from: 'berita',
                            original_doc_id: beritaDoc.id,
                            migrated_at: admin.firestore.FieldValue.serverTimestamp(),
                        },
                        created_at: legacy.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                        published_at:
                            legacy.status === 'published'
                                ? legacy.createdAt || admin.firestore.FieldValue.serverTimestamp()
                                : null,
                    };

                    // Atomic: write new post + mark old doc
                    await db.runTransaction(async (txn) => {
                        const newRef = db.collection('posts').doc();
                        newPostId = newRef.id;
                        txn.set(newRef, newPost);
                        txn.update(beritaDoc.ref, {
                            _migrated: true,
                            _migrated_to: newRef.id,
                            _migrated_at: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    });

                    totalMigrated++;
                    migrationLog.push({ old_id: beritaDoc.id, new_id: newPostId, status: 'OK' });
                    console.log(`[migration] ✓ ${beritaDoc.id} → ${newPostId}`);
                } catch (docError) {
                    totalSkipped++;
                    const errEntry = { old_id: beritaDoc.id, error: docError.message };
                    errorLog.push(errEntry);
                    console.error(`[migration] ✗ ${beritaDoc.id}:`, docError.message);
                    // Continue — don't abort entire batch
                }
            }

            cursor = snapshot.docs[snapshot.docs.length - 1];
        }

        // Save audit report to Firestore
        await db.collection('_migrations').add({
            type: 'berita_to_posts',
            started_at: startTime.toISOString(),
            completed_at: admin.firestore.FieldValue.serverTimestamp(),
            total_migrated: totalMigrated,
            total_skipped: totalSkipped,
            error_log: errorLog,
        });

        console.log(`[migration] Complete. Migrated: ${totalMigrated}, Skipped: ${totalSkipped}`);

        res.json({
            success: true,
            total_migrated: totalMigrated,
            total_skipped: totalSkipped,
            errors: errorLog,
        });
    } catch (error) {
        console.error('[runMigration] Fatal error in migration process:', error);
        if (error.stack) console.error(error.stack);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

/**
 * GET /api/admin/migrate/status
 * Returns the latest migration report from `_migrations` collection.
 */
exports.getMigrationStatus = async (req, res) => {
    try {
        const db = getFirestore();

        // Count original berita docs
        const beritaTotal = await db.collection('berita').count().get();
        const beritaMigrated = await db
            .collection('berita')
            .where('_migrated', '==', true)
            .count()
            .get();

        // Latest migration run
        const latestReport = await db
            .collection('_migrations')
            .where('type', '==', 'berita_to_posts')
            .orderBy('completed_at', 'desc')
            .limit(1)
            .get();

        const report = latestReport.empty
            ? null
            : { id: latestReport.docs[0].id, ...latestReport.docs[0].data() };

        // posts count
        const postsTotal = await db.collection('posts').count().get();

        res.json({
            success: true,
            berita_total: beritaTotal.data().count,
            berita_migrated: beritaMigrated.data().count,
            berita_pending: beritaTotal.data().count - beritaMigrated.data().count,
            posts_total: postsTotal.data().count,
            latest_report: report,
        });
    } catch (error) {
        console.error('[getMigrationStatus]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/migrate/cleanup-assets
 * Orphan Cloudinary asset cleanup: finds assets in posts/ folder not referenced in Firestore.
 */
exports.cleanupOrphanedAssets = async (req, res) => {
    try {
        const db = getFirestore();
        const cloudinary = require('cloudinary').v2;

        // Collect all referenced public_ids from Firestore
        const referencedIds = new Set();
        const postsSnapshot = await db.collection('posts').get();
        postsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data?.media?.header_image?.public_id) {
                referencedIds.add(data.media.header_image.public_id);
            }
            if (Array.isArray(data?.media?.inline_assets)) {
                data.media.inline_assets.forEach((a) => {
                    if (a?.public_id) referencedIds.add(a.public_id);
                });
            }
        });

        // List all Cloudinary assets in posts/ folder
        let allAssets = [];
        let nextCursor = null;
        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'posts/',
                max_results: 500,
                next_cursor: nextCursor || undefined,
            });
            allAssets = allAssets.concat(result.resources || []);
            nextCursor = result.next_cursor || null;
        } while (nextCursor);

        // Find orphans
        const orphans = allAssets.filter((a) => !referencedIds.has(a.public_id));

        // Delete in batches of 100
        let deleted = 0;
        for (let i = 0; i < orphans.length; i += 100) {
            const batch = orphans.slice(i, i + 100).map((a) => a.public_id);
            await cloudinary.api.delete_resources(batch);
            deleted += batch.length;
        }

        res.json({
            success: true,
            total_cloudinary: allAssets.length,
            total_referenced: referencedIds.size,
            orphans_deleted: deleted,
        });
    } catch (error) {
        console.error('[cleanupOrphanedAssets]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
