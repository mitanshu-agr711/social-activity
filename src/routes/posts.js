const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getAllPosts)
  .post(protect, createPost);

router.route('/:id')
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.get('/user/:userId', protect, getUserPosts);
router.post('/:id/like', protect, likePost);
router.delete('/:id/unlike', protect, unlikePost);

module.exports = router;
