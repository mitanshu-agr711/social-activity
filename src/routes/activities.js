const express = require('express');
const router = express.Router();
const {
  getActivityWall,
  getUserActivities
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getActivityWall);
router.get('/user/:userId', protect, getUserActivities);

module.exports = router;
