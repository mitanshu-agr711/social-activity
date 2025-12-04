const { User } = require('../models');

// @desc    Create admin (Owner only)
// @route   POST /api/owner/admins
// @access  Private (Owner)
exports.createAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change owner role'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: `${user.username} is now an admin`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove admin (Owner only)
// @route   DELETE /api/owner/admins/:id
// @access  Private (Owner)
exports.removeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    user.role = 'user';
    await user.save();

    res.status(200).json({
      success: true,
      message: `${user.username} is no longer an admin`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins (Owner only)
// @route   GET /api/owner/admins
// @access  Private (Owner)
exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'owner'] } })
      .select('-password')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    next(error);
  }
};
