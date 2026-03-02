/**
 * postController.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles all CRUD for the `posts` Firestore collection, including:
 *  - Region-scoped feed with cursor-based pagination
 *  - Atomic like/unlike via Firestore transactions
 *  - Atomic comment add/delete with soft-delete and counter sync
 *  - Cloudinary asset cleanup on post delete and update
 *
 * Firestore schema: see news_feed_architecture.md §2
 * ──────────────────────────────────────────────────────────────────────────────
 */

const { getFirestore, admin } = require('../config/firebase');
const cloudinary = require('cloudinary').v2;

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Constants ────────────────────────────────────────────────────────────────
const COLLECTION = 'posts';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract Cloudinary public_id from a full secure URL.
 * e.g. "https://res.cloudinary.com/lmpweb/image/upload/v17093/posts/abc/header.jpg"
 *   → "posts/abc/header"
 */
function extractPublicId(url) {
    if (!url) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let path = parts[1];
        // Strip version prefix (v1234567890/)
        path = path.replace(/^v\d+\//, '');
        // Strip file extension
        path = path.replace(/\.[^/.]+$/, '');
        return path || null;
    } catch {
        return null;
    }
}

/**
 * Collect all Cloudinary public_ids referenced in a post document.
 */
function collectPublicIds(postData) {
    const ids = [];
    if (postData?.media?.header_image?.public_id) {
        ids.push(postData.media.header_image.public_id);
    }
    if (Array.isArray(postData?.media?.inline_assets)) {
        postData.media.inline_assets.forEach((a) => {
            if (a?.public_id) ids.push(a.public_id);
        });
    }
    return ids;
}

/**
 * Delete a list of Cloudinary asset public_ids (fire-and-forget with logging).
 */
async function destroyCloudinaryAssets(publicIds) {
    if (!publicIds || publicIds.length === 0) return;
    const results = await Promise.allSettled(
        publicIds.map((pid) =>
            cloudinary.uploader.destroy(pid, { invalidate: true })
        )
    );
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`[postController] Cloudinary destroy failed for "${publicIds[i]}":`, r.reason?.message);
        } else {
            console.log(`[postController] Cloudinary asset deleted: ${publicIds[i]} → ${r.value?.result}`);
        }
    });
}

/**
 * Delete all documents in a sub-collection (Firestore does not cascade).
 */
async function deleteSubcollection(db, parentPath, subCollectionName) {
    const colRef = db.collection(`${parentPath}/${subCollectionName}`);
    const snapshot = await colRef.get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}

// ─── Generate excerpt (server-side) ──────────────────────────────────────────
function generateExcerpt(htmlBody, maxLength = 200) {
    if (!htmlBody) return '';
    // Strip HTML tags
    let text = htmlBody.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) return truncated.substring(0, lastSpace) + '…';
    return truncated + '…';
}

// ─── CONTROLLERS ─────────────────────────────────────────────────────────────

/**
 * GET /api/posts/pinned
 * Returns the first pinned + published post (for Hero card on feed page).
 */
exports.getPinnedPost = async (req, res) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection(COLLECTION)
            .where('status', '==', 'published')
            .where('is_pinned', '==', true)
            .orderBy('created_at', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({ success: true, post: null });
        }

        const doc = snapshot.docs[0];
        res.json({ success: true, post: { id: doc.id, ...doc.data() } });
    } catch (error) {
        console.error('[getPinnedPost]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/posts/trending
 * Returns top 5 published posts sorted by view_count descending.
 */
exports.getTrendingPosts = async (req, res) => {
    try {
        const db = getFirestore();
        const limit = Math.min(parseInt(req.query.limit) || 5, 10);

        const snapshot = await db.collection(COLLECTION)
            .where('status', '==', 'published')
            .orderBy('metrics.view_count', 'desc')
            .limit(limit)
            .get();

        const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json({ success: true, posts });
    } catch (error) {
        console.error('[getTrendingPosts]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/posts
 * Region-scoped feed. Reads caller's region from Firestore `users` collection.
 * Query params: limit, cursor (last doc ID), category, scope
 */
exports.getPosts = async (req, res) => {
    try {
        const db = getFirestore();
        const uid = req.uid; // null if unauthenticated (verifyTokenOptional)

        // Resolve caller's region — skip for guests
        let userRegionId = null;
        let userRegionLevel = null;
        if (uid) {
            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            userRegionId = userData?.kepengurusan?.region_id || '00';
            userRegionLevel = userData?.kepengurusan?.level || 'pusat';
        }

        const pageSize = Math.min(parseInt(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        const category = req.query.category || null;
        const cursorDocId = req.query.cursor || null;

        let q = db.collection(COLLECTION)
            .where('status', '==', 'published')
            .orderBy('is_pinned', 'desc')
            .orderBy('created_at', 'desc');

        if (category) {
            q = db.collection(COLLECTION)
                .where('status', '==', 'published')
                .where('category', '==', category)
                .orderBy('created_at', 'desc');
        }

        // Apply cursor for pagination
        if (cursorDocId) {
            const cursorDoc = await db.collection(COLLECTION).doc(cursorDocId).get();
            if (cursorDoc.exists) {
                q = q.startAfter(cursorDoc);
            }
        }

        q = q.limit(pageSize + 1);
        const snapshot = await q.get();

        const allDocs = snapshot.docs;
        const hasMore = allDocs.length > pageSize;
        const docs = hasMore ? allDocs.slice(0, pageSize) : allDocs;

        // Filter by visibility (region-scoped for members; national-only for guests)
        const posts = docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((post) => {
                const v = post.visibility;
                if (!v) return true;
                // Guests: only national posts
                if (!uid) return v.scope === 'national';
                // Authenticated members: full region logic
                if (v.scope === 'national') return true;
                if (userRegionLevel === 'pusat') return true;
                if (v.region_id === userRegionId) return true;
                // Ancestor sees descendant posts
                if (v.visible_to_ancestors && v.region_id?.startsWith(userRegionId)) return true;
                // Descendant sees ancestor posts
                if (v.visible_to_descendants && userRegionId?.startsWith(v.region_id)) return true;
                return false;
            });

        const nextCursor = hasMore ? docs[docs.length - 1].id : null;

        res.json({ success: true, posts, nextCursor, hasMore });
    } catch (error) {
        console.error('[getPosts]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * GET /api/posts/:postId
 * Single post. Also increments view_count atomically.
 */
exports.getPostById = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const postRef = db.collection(COLLECTION).doc(postId);

        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
        }

        // Increment view_count (fire-and-forget, don't block response)
        postRef.update({
            'metrics.view_count': admin.firestore.FieldValue.increment(1),
        }).catch((err) => console.error('[getPostById] view_count increment error:', err));

        res.json({ success: true, post: { id: postDoc.id, ...postDoc.data() } });
    } catch (error) {
        console.error('[getPostById]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/posts
 * Create a new post. Admin only (verifyAdmin middleware).
 * Body: { title, content: {html_body}, media: {header_image, inline_assets}, visibility, category, tags, status }
 */
exports.createPost = async (req, res) => {
    try {
        const db = getFirestore();
        const uid = req.uid;

        const { title, content, media, visibility, category, tags, status, is_pinned } = req.body;

        if (!title?.trim()) return res.status(400).json({ success: false, message: 'Judul tidak boleh kosong' });
        if (!content?.html_body) return res.status(400).json({ success: false, message: 'Konten tidak boleh kosong' });

        // Resolve author info
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const excerpt = content.excerpt || generateExcerpt(content.html_body);

        const headerImage = media?.header_image || { url: '', public_id: '' };
        const inlineAssets = Array.isArray(media?.inline_assets) ? media.inline_assets : [];

        const regionId = visibility?.region_id || userData?.kepengurusan?.region_id || '00';
        const regionName = visibility?.region_name || userData?.kepengurusan?.region_name || 'Nasional';
        const regionLevel = visibility?.region_level || userData?.kepengurusan?.level || 'pusat';

        const newPost = {
            _schema_version: 2,
            title: title.trim(),
            content: {
                html_body: content.html_body,
                excerpt,
                format: content.format || 'tiptap_html',
            },
            media: {
                header_image: {
                    url: headerImage.url || '',
                    public_id: headerImage.public_id || extractPublicId(headerImage.url) || '',
                    width: headerImage.width || null,
                    height: headerImage.height || null,
                },
                inline_assets: inlineAssets.map((a) => ({
                    url: a.url || '',
                    public_id: a.public_id || extractPublicId(a.url) || '',
                    type: a.type || 'image',
                })),
            },
            author: {
                uid,
                display_name: userData.displayName || 'Admin LMP',
                photo_url: userData.photoURL || '',
                role: userData.role || 'admin',
                region_id: userData?.kepengurusan?.region_id || '00',
                region_name: userData?.kepengurusan?.region_name || 'Nasional',
            },
            visibility: {
                scope: regionId === '00' ? 'national' : 'regional',
                region_id: regionId,
                region_name: regionName,
                region_level: regionLevel,
                visible_to_ancestors: visibility?.visible_to_ancestors !== false,
                visible_to_descendants: visibility?.visible_to_descendants !== false,
            },
            category: category || 'berita',
            tags: Array.isArray(tags) ? tags : [],
            status: status || 'draft',
            is_pinned: is_pinned === true,
            metrics: {
                like_count: 0,
                comment_count: 0,
                view_count: 0,
                share_count: 0,
            },
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            published_at: status === 'published' ? admin.firestore.FieldValue.serverTimestamp() : null,
        };

        const docRef = await db.collection(COLLECTION).add(newPost);
        res.status(201).json({ success: true, postId: docRef.id, message: 'Post berhasil dibuat' });
    } catch (error) {
        console.error('[createPost]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/posts/:postId
 * Update a post. Diffs old vs new Cloudinary assets; destroys orphans.
 */
exports.updatePost = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const postRef = db.collection(COLLECTION).doc(postId);

        const postDoc = await postRef.get();
        if (!postDoc.exists) return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });

        const oldData = postDoc.data();
        const { title, content, media, visibility, category, tags, status, is_pinned } = req.body;

        // Compute orphaned Cloudinary assets
        const oldIds = new Set(collectPublicIds(oldData));
        const newIds = new Set(collectPublicIds(media));
        const orphanIds = [...oldIds].filter((id) => !newIds.has(id));

        const excerpt = (content?.html_body)
            ? (content.excerpt || generateExcerpt(content.html_body))
            : oldData.content?.excerpt;

        const updatePayload = {
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (title !== undefined) updatePayload.title = title.trim();
        if (content?.html_body !== undefined) {
            updatePayload['content.html_body'] = content.html_body;
            updatePayload['content.excerpt'] = excerpt;
        }
        if (media !== undefined) updatePayload.media = media;
        if (visibility !== undefined) updatePayload.visibility = visibility;
        if (category !== undefined) updatePayload.category = category;
        if (tags !== undefined) updatePayload.tags = tags;
        if (status !== undefined) {
            updatePayload.status = status;
            if (status === 'published' && oldData.status !== 'published') {
                updatePayload.published_at = admin.firestore.FieldValue.serverTimestamp();
            }
        }
        if (is_pinned !== undefined) updatePayload.is_pinned = is_pinned;

        await postRef.update(updatePayload);

        // Destroy orphaned Cloudinary assets in background
        if (orphanIds.length > 0) {
            destroyCloudinaryAssets(orphanIds).catch((e) =>
                console.error('[updatePost] orphan cleanup error:', e)
            );
        }

        res.json({ success: true, message: 'Post berhasil diperbarui' });
    } catch (error) {
        console.error('[updatePost]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/posts/:postId
 * Delete post: Cloudinary assets → subcollections → Firestore doc.
 */
exports.deletePost = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const postRef = db.collection(COLLECTION).doc(postId);

        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
        }

        const postData = postDoc.data();
        const publicIds = collectPublicIds(postData);

        // 1. Delete Cloudinary assets
        if (publicIds.length > 0) {
            await destroyCloudinaryAssets(publicIds);
        }

        // 2. Delete sub-collections (likes, comments)
        await deleteSubcollection(db, `${COLLECTION}/${postId}`, 'likes');
        await deleteSubcollection(db, `${COLLECTION}/${postId}`, 'comments');

        // 3. Delete the post document
        await postRef.delete();

        res.json({ success: true, message: 'Post dan semua aset berhasil dihapus' });
    } catch (error) {
        console.error('[deletePost]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── LIKE / UNLIKE ────────────────────────────────────────────────────────────

/**
 * POST /api/posts/:postId/like
 * Toggle like/unlike using an atomic Firestore transaction.
 * likeDoc ID = userId (uniqueness constraint).
 */
exports.toggleLike = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const userId = req.uid;
        const displayName = req.user?.name || req.user?.displayName || 'User';
        const photoURL = req.user?.picture || '';

        const postRef = db.collection(COLLECTION).doc(postId);
        const likeRef = postRef.collection('likes').doc(userId);

        let postAuthorUid = null;
        let postTitle = '';

        const result = await db.runTransaction(async (txn) => {
            const [postDoc, likeDoc] = await Promise.all([txn.get(postRef), txn.get(likeRef)]);

            if (!postDoc.exists) throw new Error('Post tidak ditemukan');
            postAuthorUid = postDoc.data()?.author?.uid;
            postTitle = postDoc.data()?.title || 'Berita';

            if (likeDoc.exists) {
                // Unlike
                txn.delete(likeRef);
                txn.update(postRef, {
                    'metrics.like_count': admin.firestore.FieldValue.increment(-1),
                });
                return { liked: false, delta: -1 };
            } else {
                // Like
                txn.set(likeRef, {
                    user_id: userId,
                    display_name: displayName,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                });
                txn.update(postRef, {
                    'metrics.like_count': admin.firestore.FieldValue.increment(1),
                });
                return { liked: true, delta: 1 };
            }
        });

        // Fire-and-forget: write notification to post author (skip self-like)
        if (result.liked && postAuthorUid && postAuthorUid !== userId) {
            db.collection('notifications').doc(postAuthorUid).collection('items').add({
                type: 'like',
                actorId: userId,
                actorName: displayName,
                actorPhotoURL: photoURL,
                postId,
                postTitle,
                message: `${displayName} menyukai artikel Anda`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }).catch((e) => console.error('[toggleLike] notification error:', e));
        }

        const updatedPost = await postRef.get();
        const likeCount = updatedPost.data()?.metrics?.like_count ?? 0;

        res.json({ success: true, liked: result.liked, like_count: likeCount });
    } catch (error) {
        console.error('[toggleLike]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/posts/:postId/likes
 * Get list of users who liked a post.
 */
exports.getLikes = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;

        const snapshot = await db
            .collection(COLLECTION)
            .doc(postId)
            .collection('likes')
            .orderBy('created_at', 'desc')
            .limit(100)
            .get();

        const likes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json({ success: true, likes });
    } catch (error) {
        console.error('[getLikes]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/posts/:postId/likes/check
 * Check if the current user has liked a post.
 */
exports.checkLike = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const userId = req.uid;

        const likeDoc = await db
            .collection(COLLECTION)
            .doc(postId)
            .collection('likes')
            .doc(userId)
            .get();

        res.json({ success: true, liked: likeDoc.exists });
    } catch (error) {
        console.error('[checkLike]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/posts/:postId/comments
 * List comments for a post (paginated).
 */
exports.getComments = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const pageSize = Math.min(parseInt(req.query.limit) || 50, 100);
        const cursorDocId = req.query.cursor || null;

        let q = db
            .collection(COLLECTION)
            .doc(postId)
            .collection('comments')
            .orderBy('created_at', 'asc')
            .limit(pageSize + 1);

        if (cursorDocId) {
            const cursorDoc = await db
                .collection(COLLECTION)
                .doc(postId)
                .collection('comments')
                .doc(cursorDocId)
                .get();
            if (cursorDoc.exists) q = q.startAfter(cursorDoc);
        }

        const snapshot = await q.get();
        const allDocs = snapshot.docs;
        const hasMore = allDocs.length > pageSize;
        const docs = hasMore ? allDocs.slice(0, pageSize) : allDocs;

        const comments = docs.map((d) => ({ id: d.id, ...d.data() }));
        const nextCursor = hasMore ? docs[docs.length - 1].id : null;

        res.json({ success: true, comments, nextCursor, hasMore });
    } catch (error) {
        console.error('[getComments]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/posts/:postId/comments
 * Add a comment (or reply). Atomic: increment post.metrics.comment_count.
 */
exports.addComment = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId } = req.params;
        const { body, parentCommentId = null } = req.body;
        const userId = req.uid;

        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Isi komentar tidak boleh kosong' });
        }
        if (body.length > 2000) {
            return res.status(400).json({ success: false, message: 'Komentar maksimal 2000 karakter' });
        }

        const postRef = db.collection(COLLECTION).doc(postId);
        let newCommentId;

        await db.runTransaction(async (txn) => {
            const postDoc = await txn.get(postRef);
            if (!postDoc.exists) throw new Error('Post tidak ditemukan');

            // Determine reply depth
            let depth = 0;
            if (parentCommentId) {
                const parentRef = postRef.collection('comments').doc(parentCommentId);
                const parentDoc = await txn.get(parentRef);
                if (!parentDoc.exists) throw new Error('Parent komentar tidak ditemukan');
                depth = (parentDoc.data().depth || 0) + 1;
                if (depth > 2) throw new Error('Kedalaman balasan maksimal 2 level');
            }

            // Resolve user info for denormalization
            const userDoc = await txn.get(db.collection('users').doc(userId));
            const userData = userDoc.exists ? userDoc.data() : {};

            const commentRef = postRef.collection('comments').doc();
            newCommentId = commentRef.id;

            txn.set(commentRef, {
                author: {
                    uid: userId,
                    display_name: userData.displayName || 'Anggota LMP',
                    photo_url: userData.photoURL || '',
                    role: userData.role || 'member',
                },
                body: body.trim(),
                body_format: 'plain_text',
                parent_comment_id: parentCommentId,
                depth,
                is_edited: false,
                is_deleted: false,
                like_count: 0,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            txn.update(postRef, {
                'metrics.comment_count': admin.firestore.FieldValue.increment(1),
            });
        });

        // Read the newly created comment to return it
        const newCommentDoc = await postRef.collection('comments').doc(newCommentId).get();

        // Fire-and-forget: notify post author (skip self-comment)
        try {
            const postSnap = await postRef.get();
            const postAuthorUid = postSnap.data()?.author?.uid;
            const postTitle = postSnap.data()?.title || 'Berita';
            if (postAuthorUid && postAuthorUid !== userId) {
                const userDoc = await db.collection('users').doc(userId).get();
                const actorName = userDoc.exists ? (userDoc.data().displayName || 'Anggota LMP') : 'Anggota LMP';
                const actorPhotoURL = userDoc.exists ? (userDoc.data().photoURL || '') : '';
                db.collection('notifications').doc(postAuthorUid).collection('items').add({
                    type: 'comment',
                    actorId: userId,
                    actorName,
                    actorPhotoURL,
                    postId,
                    postTitle,
                    message: `${actorName} mengomentari artikel Anda`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                }).catch((e) => console.error('[addComment] notification error:', e));
            }
        } catch (notifErr) {
            console.error('[addComment] notification lookup error:', notifErr.message);
        }

        res.status(201).json({
            success: true,
            comment: { id: newCommentId, ...newCommentDoc.data() },
            message: 'Komentar berhasil ditambahkan',
        });
    } catch (error) {
        console.error('[addComment]', error);
        const status = error.message.includes('tidak ditemukan') || error.message.includes('tidak boleh') ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/posts/:postId/comments/:commentId
 * Soft-delete a comment (body replaced, is_deleted=true) + decrement counter.
 */
exports.deleteComment = async (req, res) => {
    try {
        const db = getFirestore();
        const { postId, commentId } = req.params;
        const userId = req.uid;

        const postRef = db.collection(COLLECTION).doc(postId);
        const commentRef = postRef.collection('comments').doc(commentId);

        await db.runTransaction(async (txn) => {
            const [commentDoc, userDoc] = await Promise.all([
                txn.get(commentRef),
                txn.get(db.collection('users').doc(userId)),
            ]);

            if (!commentDoc.exists) throw new Error('Komentar tidak ditemukan');
            const commentData = commentDoc.data();
            const userData = userDoc.exists ? userDoc.data() : {};

            // Authorization: only author or admin
            if (commentData.author.uid !== userId && userData.role !== 'admin') {
                throw new Error('Tidak memiliki izin untuk menghapus komentar ini');
            }

            if (commentData.is_deleted) {
                throw new Error('Komentar sudah dihapus');
            }

            txn.update(commentRef, {
                is_deleted: true,
                body: '[Komentar telah dihapus]',
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            txn.update(postRef, {
                'metrics.comment_count': admin.firestore.FieldValue.increment(-1),
            });
        });

        res.json({ success: true, message: 'Komentar berhasil dihapus' });
    } catch (error) {
        console.error('[deleteComment]', error);
        const status = error.message.includes('tidak ditemukan') || error.message.includes('izin') ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/notifications/read
 * Mark all unread notifications for the caller as read.
 */
exports.markNotificationsRead = async (req, res) => {
    try {
        const db = getFirestore();
        const uid = req.uid;
        const snapshot = await db.collection('notifications').doc(uid)
            .collection('items')
            .where('read', '==', false)
            .limit(100)
            .get();
        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
            await batch.commit();
        }
        res.json({ success: true, updated: snapshot.size });
    } catch (error) {
        console.error('[markNotificationsRead]', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
