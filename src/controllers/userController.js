const { User } = require('../models');
const { logActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture')
      .select('-password -blockedUsers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user is blocked by the profile owner
    const profileOwner = await User.findById(req.params.id);
    if (profileOwner.hasBlocked(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot view this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, profilePicture } = req.body;

    const fieldsToUpdate = {};
    if (username) fieldsToUpdate.username = username;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (profilePicture !== undefined) fieldsToUpdate.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't follow yourself
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Check if blocked
    if (userToFollow.hasBlocked(req.user.id) || currentUser.hasBlocked(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot follow this user'
      });
    }

    // Add to following list
    currentUser.following.push(req.params.id);
    await currentUser.save();

    // Add to followers list
    userToFollow.followers.push(req.user.id);
    await userToFollow.save();

    // Log activity
    await logActivity(
      ACTIVITY_TYPES.USER_FOLLOWED,
      currentUser,
      userToFollow._id,
      'User',
      { followedUser: userToFollow.username }
    );

    res.status(200).json({
      success: true,
      message: `You are now following ${userToFollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/unfollow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if not following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user'
      });
    }

    // Remove from following list
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    await currentUser.save();

    // Remove from followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id.toString()
    );
    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't block yourself
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Add to blocked list
    currentUser.blockedUsers.push(req.params.id);
    await currentUser.save();

    // Remove from following/followers if exists
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    currentUser.followers = currentUser.followers.filter(
      id => id.toString() !== req.params.id
    );
    await currentUser.save();

    userToBlock.following = userToBlock.following.filter(
      id => id.toString() !== req.user.id.toString()
    );
    userToBlock.followers = userToBlock.followers.filter(
      id => id.toString() !== req.user.id.toString()
    );
    await userToBlock.save();

    res.status(200).json({
      success: true,
      message: `You have blocked ${userToBlock.username}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/unblock
// @access  Private
exports.unblockUser = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Check if user is blocked
    if (!currentUser.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    // Remove from blocked list
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== req.params.id
    );
    await currentUser.save();

    res.status(200).json({
      success: true,
      message: 'User has been unblocked'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('username email bio profilePicture role createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};
