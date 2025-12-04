const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getAllUsers
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/unfollow', protect, unfollowUser);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/unblock', protect, unblockUser);

module.exports = router;
