const { User, Post } = require('../models');
const { logActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// @desc    Delete user (Admin/Owner)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin/Owner)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting owner
    if (user.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete owner account'
      });
    }

    // Admin cannot delete another admin
    if (req.user.role === 'admin' && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot delete another admin'
      });
    }

    // Log activity
    await logActivity(
      ACTIVITY_TYPES.USER_DELETED,
      user,
      user._id,
      'User',
      {
        deletedByRole: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
        deletedBy: req.user.id
      }
    );

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post (Admin/Owner)
// @route   DELETE /api/admin/posts/:id
// @access  Private (Admin/Owner)
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Post already deleted'
      });
    }

    // Log activity
    await logActivity(
      ACTIVITY_TYPES.POST_DELETED,
      post.author,
      post._id,
      'Post',
      {
        deletedByRole: req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1),
        deletedBy: req.user.id
      }
    );

    // Soft delete
    post.isDeleted = true;
    post.deletedBy = req.user.id;
    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove like from post (Admin/Owner)
// @route   DELETE /api/admin/posts/:postId/likes/:userId
// @access  Private (Admin/Owner)
exports.removeLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.params.userId;

    if (!post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User has not liked this post'
      });
    }

    post.likes = post.likes.filter(id => id.toString() !== userId);
    post.likesCount = post.likes.length;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Like removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users including inactive (Admin/Owner)
// @route   GET /api/admin/users
// @access  Private (Admin/Owner)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
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

// @desc    Get all posts including deleted (Admin/Owner)
// @route   GET /api/admin/posts
// @access  Private (Admin/Owner)
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profilePicture')
      .populate('deletedBy', 'username role')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};
