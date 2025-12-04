const { Post, User } = require('../models');
const { logActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      image: image || ''
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profilePicture');

    // Log activity
    await logActivity(
      ACTIVITY_TYPES.POST_CREATED,
      req.user,
      post._id,
      'Post',
      { postContent: content }
    );

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Private
exports.getAllPosts = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Get posts excluding blocked users and deleted posts
    const posts = await Post.find({
      isDeleted: false,
      author: { $nin: currentUser.blockedUsers }
    })
      .populate('author', 'username profilePicture')
      .populate('likes', 'username')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post has been deleted'
      });
    }

    // Check if author is blocked
    const currentUser = await User.findById(req.user.id);
    if (currentUser.hasBlocked(post.author._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view this post'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
exports.getUserPosts = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Check if user is blocked
    if (currentUser.hasBlocked(req.params.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view posts from this user'
      });
    }

    const posts = await Post.find({
      author: req.params.userId,
      isDeleted: false
    })
      .populate('author', 'username profilePicture')
      .populate('likes', 'username')
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

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update deleted post'
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { content, image } = req.body;
    if (content) post.content = content;
    if (image !== undefined) post.image = image;

    await post.save();

    post = await Post.findById(post._id)
      .populate('author', 'username profilePicture')
      .populate('likes', 'username');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post (by owner)
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
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
        message: 'Cannot like a deleted post'
      });
    }

    // Check if already liked
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    // Check if author is blocked
    const currentUser = await User.findById(req.user.id);
    if (currentUser.hasBlocked(post.author._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot like this post'
      });
    }

    post.likes.push(req.user.id);
    post.likesCount = post.likes.length;
    await post.save();

    // Log activity
    await logActivity(
      ACTIVITY_TYPES.POST_LIKED,
      req.user,
      post._id,
      'Post',
      { postAuthor: post.author.username }
    );

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      likesCount: post.likesCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/unlike
// @access  Private
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if not liked
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked yet'
      });
    }

    post.likes = post.likes.filter(id => id.toString() !== req.user.id.toString());
    post.likesCount = post.likes.length;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      likesCount: post.likesCount
    });
  } catch (error) {
    next(error);
  }
};
