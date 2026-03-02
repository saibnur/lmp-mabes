const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, verifyTokenOptional } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');

/**
 * Posts Routes
 * All routes are prefixed with /api/posts
 */

// Feed & single post (authenticated users)
router.get('/', verifyTokenOptional, postController.getPosts);
router.get('/pinned', verifyTokenOptional, postController.getPinnedPost);
router.get('/trending', verifyTokenOptional, postController.getTrendingPosts);
router.get('/:postId', verifyTokenOptional, postController.getPostById);

// Create / Update / Delete (admin only)
router.post('/', verifyAdmin, postController.createPost);
router.put('/:postId', verifyAdmin, postController.updatePost);
router.delete('/:postId', verifyAdmin, postController.deletePost);

// Likes (authenticated users)
router.post('/:postId/like', verifyToken, postController.toggleLike);
router.get('/:postId/likes', verifyToken, postController.getLikes);
router.get('/:postId/likes/check', verifyToken, postController.checkLike);

// Comments (authenticated users)
router.get('/:postId/comments', verifyToken, postController.getComments);
router.post('/:postId/comments', verifyToken, postController.addComment);
router.delete('/:postId/comments/:commentId', verifyToken, postController.deleteComment);

// Notifications (authenticated users)
router.patch('/notifications/read', verifyToken, postController.markNotificationsRead);

module.exports = router;
