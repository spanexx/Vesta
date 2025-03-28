import UserProfile from '../models/UserProfile.js';

const featureLimits = {
  free: {
    photoLimit: 3,
    videoLimit: 0,
    canUploadVideos: false
  },
  standard: {
    photoLimit: 5,
    videoLimit: 1,
    canUploadVideos: false
  },
  premium: {
    photoLimit: 8,
    videoLimit: 3,
    canUploadVideos: true
  },
  vip: {
    photoLimit: 10, // unlimited
    videoLimit: 5, // unlimited
    canUploadVideos: true
  }
};

export const checkUploadLimits = async (req, res, next) => {
  try {
    const profile = await UserProfile.findById(req.body.userId);
    if (!profile) {
      console.error('Profile not found');
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      });
    }

    const tier = profile.profileLevel || 'free';
    const limits = featureLimits[tier];

        // Determine file type from contentType
        const fileType = req.body.contentType?.startsWith('image/') ? 'photo' : 
        req.body.contentType?.startsWith('video/') ? 'video' : null;

    // Validate content type matches declared type
    const declaredType = req.body.contentType;
    const actualType = req.body.base64Data?.split(';')[0]?.split(':')[1];
    console.log('Declared type:', declaredType);
    console.log('Actual type:', actualType);
    if (actualType && declaredType !== actualType) {
      return res.status(400).json({
        error: 'CONTENT_TYPE_MISMATCH',
        message: `Content type mismatch: declared ${declaredType}, actual ${actualType}`
      });
    }
    
    // Check file type and apply relevant limits
    if (req.body.contentType === 'image/jpeg' || req.body.contentType === 'image/png') {
      const currentPhotoCount = profile.images?.length || 0;
      console.log('Current photo count:', currentPhotoCount);
      const newPhotoCount = Array.isArray(req.body.files) ? req.body.files.length : 1;
      console.log('New photo count:', newPhotoCount);
      
      if (limits.photoLimit !== -1 && currentPhotoCount + newPhotoCount > limits.photoLimit) {
        return res.status(403).json({
          error: 'LIMIT_EXCEEDED',
          message: `Photo limit exceeded for ${tier} tier`
        });
      }
    }

    if (fileType === 'video') {
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
    console.error('Error checking upload limits:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error checking upload limits',
      details: error.message
    });
  }
};


export default checkUploadLimits;