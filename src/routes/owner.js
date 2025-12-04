const express = require('express');
const router = express.Router();
const {
  createAdmin,
  removeAdmin,
  getAllAdmins
} = require('../controllers/ownerController');
const { protect, isOwner } = require('../middleware/auth');

// All routes require owner role
router.use(protect);
router.use(isOwner);

router.route('/admins')
  .get(getAllAdmins)
  .post(createAdmin);

router.delete('/admins/:id', removeAdmin);

module.exports = router;
