import express from 'express';
import UserProfile from '../models/UserProfile.js';
import auth from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Check if user has active video subscription
const checkVideoSubscription = async (req, res, next) => {
  try {
    const profile = await UserProfile.findById(req.userId);
    if (!profile.videoSubscription?.isSubscribed || 
        profile.videoSubscription.expiresAt < new Date()) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Active video subscription required'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.userId);
    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    res.json({
      videoSubscription: {
        isSubscribed: profile.videoSubscription?.isSubscribed || false,
        subscribedAt: profile.videoSubscription?.subscribedAt,
        expiresAt: profile.videoSubscription?.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current subscriber video
router.get('/subscriber-video', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.userId);
    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    res.json({
      subscriberVideo: profile.subscriberVideo || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload subscriber video
router.post('/subscriber-video', auth, checkVideoSubscription, async (req, res) => {
  try {
    const { videoUrl, title, description } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        error: 'VIDEO_REQUIRED',
        message: 'Video URL is required'
      });
    }

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      req.userId,
      {
        subscriberVideo: {
          url: videoUrl,
          uploadedAt: new Date(),
          title: title || 'Untitled',
          description: description || ''
        }
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      subscriberVideo: updatedProfile.subscriberVideo
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      error: 'UPLOAD_FAILED',
      message: error.message 
    });
  }
});

// Get all subscriber videos
router.get('/all-videos', async (req, res) => {
  try {
    const profiles = await UserProfile.find(
      { 'subscriberVideo.url': { $exists: true, $ne: null } },
      {
        'subscriberVideo': 1,
        'username': 1,
        'profilePicture': 1,
        '_id': 1  // Explicitly include _id
      }
    );

    const videos = profiles.map(profile => ({
      videoId: profile._id,
      userId: profile._id,  // Add userId field
      username: profile.username,
      profilePicture: profile.profilePicture,
      ...profile.subscriberVideo,
      isLiked: profile.subscriberVideo?.likedBy?.includes(req.userId)
    }));

    res.json({
      success: true,
      videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: error.message
    });
  }
});

// Add like video route - Update to handle auth state
router.post('/:videoId/like', async (req, res) => {
  try {
    let userId = null;
    
    // Check if there's an auth token
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } else {
      userId = 'anonymous'; // For non-authenticated users
    }

    const profile = await UserProfile.likeVideo(req.params.videoId, userId);
    if (!profile) {
      return res.status(404).json({
        error: 'VIDEO_NOT_FOUND',
        message: 'Video not found or already liked'
      });
    }
    res.json({
      success: true,
      likes: profile.subscriberVideo.likes,
      isLiked: true
    });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add unlike video route - Update to handle auth state
router.post('/:videoId/unlike', async (req, res) => {
  try {
    let userId = null;
    
    // Check if there's an auth token
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } else {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Must be logged in to unlike'
      });
    }

    const profile = await UserProfile.unlikeVideo(req.params.videoId, userId);
    if (!profile) {
      return res.status(404).json({
        error: 'VIDEO_NOT_FOUND',
        message: 'Video not found or not liked'
      });
    }
    res.json({
      success: true,
      likes: profile.subscriberVideo.likes,
      isLiked: false
    });
  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
