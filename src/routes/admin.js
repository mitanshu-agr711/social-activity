const express = require('express');
const router = express.Router();
const {
  deleteUser,
  deletePost,
  removeLike,
  getAllUsers,
  getAllPosts
} = require('../controllers/adminController');
const { protect, isAdminOrOwner } = require('../middleware/auth');

// All routes require admin or owner role
router.use(protect);
router.use(isAdminOrOwner);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePost);
router.delete('/posts/:postId/likes/:userId', removeLike);

module.exports = router;
