const { Activity, User } = require('../models');

// @desc    Get activity wall
// @route   GET /api/activities/wall
// @access  Private 
exports.getActivityWall = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get activities excluding blocked users
    const activities = await Activity.find({
      actor: { $nin: currentUser.blockedUsers }
    })
      .populate('actor', 'username profilePicture')
      .populate({
        path: 'target',
        select: 'username content'
      })
      .populate('metadata.deletedBy', 'username role')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Activity.countDocuments({
      actor: { $nin: currentUser.blockedUsers }
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's activities
// @route   GET /api/activities/user/:userId
// @access  Private
exports.getUserActivities = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Check if user is blocked
    if (currentUser.hasBlocked(req.params.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view activities from this user'
      });
    }

    const activities = await Activity.find({
      actor: req.params.userId
    })
      .populate('actor', 'username profilePicture')
      .populate({
        path: 'target',
        select: 'username content'
      })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};
