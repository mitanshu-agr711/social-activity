const { Activity } = require('../models');

// Activity types
const ACTIVITY_TYPES = {
  POST_CREATED: 'post_created',
  POST_LIKED: 'post_liked',
  USER_FOLLOWED: 'user_followed',
  USER_DELETED: 'user_deleted',
  POST_DELETED: 'post_deleted'
};

// Log activity
exports.logActivity = async (type, actor, target, targetModel, additionalData = {}) => {
  try {
    let message = '';
    const metadata = {};

    switch (type) {
      case ACTIVITY_TYPES.POST_CREATED:
        message = `${actor.username} made a post`;
        if (additionalData.postContent) {
          metadata.postContent = additionalData.postContent.substring(0, 100);
        }
        break;
      case ACTIVITY_TYPES.POST_LIKED:
        message = `${actor.username} liked ${additionalData.postAuthor}'s post`;
        break;
      case ACTIVITY_TYPES.USER_FOLLOWED:
        message = `${actor.username} followed ${additionalData.followedUser}`;
        break;
      case ACTIVITY_TYPES.USER_DELETED:
        message = `User deleted by '${additionalData.deletedByRole}'`;
        metadata.deletedBy = additionalData.deletedBy;
        break;
      case ACTIVITY_TYPES.POST_DELETED:
        message = `Post deleted by '${additionalData.deletedByRole}'`;
        metadata.deletedBy = additionalData.deletedBy;
        break;
      default:
        message = 'Activity occurred';
    }

    const activity = await Activity.create({
      type,
      actor: actor._id,
      target,
      targetModel,
      message,
      metadata
    });

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
