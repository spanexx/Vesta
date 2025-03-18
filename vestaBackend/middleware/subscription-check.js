import UserProfile from '../models/UserProfile.js';

const featureLimits = {
  free: {
    photoLimit: 3,
    videoLimit: 0,
    canUploadVideos: false
  },
  standard: {
    photoLimit: 5,
    videoLimit: 0,
    canUploadVideos: false
  },
  premium: {
    photoLimit: 20,
    videoLimit: 5,
    canUploadVideos: true
  },
  vip: {
    photoLimit: -1, // unlimited
    videoLimit: -1, // unlimited
    canUploadVideos: true
  }
};

const checkUploadLimits = async (req, res, next) => {
  try {
    const profile = await UserProfile.findById(req.params.userId,);
    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      });
    }

    const tier = profile.profileLevel || 'free';
    const limits = featureLimits[tier];
    
    // Check file type and apply relevant limits
    if (req.body.fileType === 'photo') {
      const currentPhotoCount = profile.images?.length || 0;
      const newPhotoCount = Array.isArray(req.body.files) ? req.body.files.length : 1;
      
      if (limits.photoLimit !== -1 && currentPhotoCount + newPhotoCount > limits.photoLimit) {
        return res.status(403).json({
          error: 'LIMIT_EXCEEDED',
          message: `Photo limit exceeded for ${tier} tier`
        });
      }
    }

    if (req.body.fileType === 'video') {
      if (!limits.canUploadVideos) {
        return res.status(403).json({
          error: 'FEATURE_NOT_AVAILABLE',
          message: `Video uploads not available for ${tier} tier`
        });
      }

      const currentVideoCount = profile.videos?.length || 0;
      const newVideoCount = Array.isArray(req.body.files) ? req.body.files.length : 1;
      
      if (limits.videoLimit !== -1 && currentVideoCount + newVideoCount > limits.videoLimit) {
        return res.status(403).json({
          error: 'LIMIT_EXCEEDED',
          message: `Video limit exceeded for ${tier} tier`
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error checking upload limits',
      details: error.message
    });
  }
};

export default checkUploadLimits;