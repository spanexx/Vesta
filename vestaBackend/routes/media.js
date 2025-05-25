import express from 'express';
import mongoose from 'mongoose'; // Add mongoose import
import mediaStorage from '../services/mediaStorage.js'; 
import UserProfile from '../models/UserProfile.js'; 
import checkUserStatus from '../middleware/checkStatus.js';
import checkUploadLimits from '../middleware/subscription-check.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Add logging middleware for all media routes
router.use((req, res, next) => {
  console.log(`🔍 Media route hit: ${req.method} ${req.originalUrl}`);
  console.log('Request params:', req.params);
  console.log('Request path:', req.path);
  next();
});

/**
 * POST /media/upload-images
 * Expects a JSON payload with:
 *   - base64Data: string (Base64 encoded media)
 *   - filename: string (original file name)
 *   - contentType: string (MIME type)
 *   - userId: string (User's ID to link the media)
 */
router.post(
  '/upload-images',
  auth,
  checkUploadLimits,
  async (req, res) => {
    const { base64Data, filename, contentType, userId } = req.body;

    if (!base64Data || !filename || !contentType || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        details: {
          base64Data: !base64Data,
          filename: !filename,
          contentType: !contentType,
          userId: !userId
        }
      });
    }

    try {
      // Verify content type matches base64 data
      const actualContentType = base64Data.match(/^data:([^;]+);base64,/)?.[1];
      if (actualContentType && actualContentType !== contentType) {
        console.warn(`Content type mismatch: declared ${contentType, actualContentType}`);
      }

      // Upload file to GridFS
      const fileId = await mediaStorage.uploadBase64Media(base64Data, filename, contentType);
      if (!fileId) {
        throw new Error('File upload did not return an ID');
      }

      // Update user profile with new image
      const updatedProfile = await UserProfile.updateImages(userId, [fileId.toString()]);
      if (!updatedProfile) {
        throw new Error('Failed to update user profile with new image');
      }

      res.status(200).json({ success: true, fileId });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.stack
      });
    }
  }
);

/**
 * POST /media/upload-video
 * Expects a JSON payload with:
 *   - base64Data: string (Base64 encoded video)
 *   - filename: string (original video file name)
 *   - contentType: string (MIME type, e.g., 'video/mp4')
 *   - userId: string (User's ID to link the video)
 */
router.post(
  '/upload-video',
  auth,
  checkUploadLimits,
  async (req, res) => {
    const { base64Data, filename, contentType, userId } = req.body;

    if (!base64Data || !filename || !contentType || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        details: {
          base64Data: !base64Data,
          filename: !filename,
          contentType: !contentType,
          userId: !userId
        }
      });
    }

    try {
      // Validate video content type
      if (!contentType.startsWith('video/')) {
        throw new Error('Invalid content type. Must be a video file.');
      }

      // Upload file to GridFS
      const fileId = await mediaStorage.uploadBase64Media(base64Data, filename, contentType);
      if (!fileId) {
        throw new Error('File upload did not return an ID');
      }

      // Update user profile with new video
      const updatedProfile = await UserProfile.updateVideos(userId, [fileId.toString()]);
      if (!updatedProfile) {
        throw new Error('Failed to update user profile with new video');
      }

      res.status(200).json({ success: true, fileId });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.stack
      });
    }
  }
);

// Add verification document upload route
router.post(
  '/verification-documents/:userId/:side',
  auth,
  async (req, res) => {
    try {
      const { base64Data, filename, contentType } = req.body;
      const { userId, side } = req.params;

      console.log('📄 Verification document upload request:', {
        userId,
        side,
        filename: !!filename,
        contentType: !!contentType ? contentType : 'missing',
        hasBase64: !!base64Data,
        base64Length: base64Data ? base64Data.length : 0
      });

      // Basic validation with detailed error messages
      if (!base64Data) {
        return res.status(400).json({
          success: false,
          message: 'Missing base64Data in request body',
          field: 'base64Data'
        });
      }

      if (!filename) {
        return res.status(400).json({
          success: false, 
          message: 'Missing filename in request body',
          field: 'filename'
        });
      }

      if (!contentType) {
        return res.status(400).json({
          success: false,
          message: 'Missing contentType in request body',
          field: 'contentType'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing userId in URL params',
          field: 'userId'
        });
      }

      if (!side) {
        return res.status(400).json({
          success: false,
          message: 'Missing side in URL params',
          field: 'side'
        });
      }      if (side !== 'front' && side !== 'back') {
        return res.status(400).json({
          success: false,
          message: 'Invalid side parameter. Must be "front" or "back"',
          field: 'side'
        });
      }
        // Make sure base64Data is properly formatted
      let processedBase64 = base64Data;
      
      // Check if the base64 data includes the data URI prefix
      if (!base64Data.startsWith('data:') && contentType) {
        processedBase64 = `data:${contentType};base64,${base64Data}`;
        console.log('Added data URI prefix to base64 data');
      }
      
      // Upload file to GridFS
      console.log(`Attempting to upload file with contentType: ${contentType}`);
      const fileId = await mediaStorage.uploadBase64Media(processedBase64, filename, contentType);
      
      console.log('File uploaded successfully with ID:', fileId);
      
      // Get user profile
      const profile = await UserProfile.findById(userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Remove existing document of same side if exists
      profile.verificationDocuments = profile.verificationDocuments.filter(doc => doc.side !== side);

      // Add new document
      profile.verificationDocuments.push({
        data: fileId.toString(),
        side,
        uploadedAt: new Date()
      });

      // Update verification status if both sides uploaded
      const hasFront = profile.verificationDocuments.some(doc => doc.side === 'front');
      const hasBack = profile.verificationDocuments.some(doc => doc.side === 'back');
      
      if (hasFront && hasBack) {
        profile.verificationStatus = 'reviewing';
      }      const updatedProfile = await profile.save();
      
      // Return a response format that matches what the client expects
      res.json({
        success: true,
        message: 'Document uploaded successfully',
        verificationStatus: updatedProfile.verificationStatus || 'pending',
        verificationDocuments: updatedProfile.verificationDocuments || []
      });
    } catch (error) {
      console.error('Verification document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload verification document',
        error: error.message
      });
    }
  }
);

// Add profile picture upload route
router.post(
  '/profile-picture/:userId',
  auth,
  checkUserStatus,
  async (req, res) => {
    console.log('🔵 Profile picture upload request received');
    console.log('Route params:', req.params);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    const { base64Data, filename, contentType } = req.body;
    const { userId } = req.params;

    console.log('Validation check:', {
      hasBase64Data: !!base64Data,
      hasFilename: !!filename,
      hasContentType: !!contentType,
      hasUserId: !!userId
    });

    if (!base64Data || !filename || !contentType || !userId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }    try {
      console.log('📤 Uploading to GridFS...');
      // Upload file to GridFS
      const fileId = await mediaStorage.uploadBase64Media(base64Data, filename, contentType);
      console.log('📤 GridFS upload successful, fileId:', fileId);
      
      // Update user profile with new profile picture ID
      console.log('🔄 Updating user profile with fileId...');
      const updatedProfile = await UserProfile.findByIdAndUpdate(
        userId,
        { profilePicture: fileId.toString() },
        { new: true }
      );

      if (!updatedProfile) {
        console.log('❌ Profile not found for userId:', userId);
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      console.log('✅ Profile picture uploaded and profile updated');
      res.json(updatedProfile);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: error.message
      });
    }
  }
);

// Add payment slip upload route
router.post(
  '/payment-slip',
  auth,
  async (req, res) => {
    const { base64Data, filename, contentType } = req.body;

    if (!base64Data || !filename || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    try {
      // Upload file to GridFS
      const fileId = await mediaStorage.uploadBase64Media(base64Data, filename, contentType);
      
      res.status(200).json({ 
        success: true, 
        fileId: fileId.toString() 
      });
    } catch (error) {
      console.error('Payment slip upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload payment slip',
        error: error.message
      });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    if (!mediaStorage.bucket) {
      return res.status(500).json({ success: false, message: 'Storage not initialized' });
    }

    const fileId = req.params.id;
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    // First, get file info to determine content type
    const fileInfo = await mediaStorage.bucket.find({ _id: objectId }).toArray();
    if (!fileInfo || fileInfo.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = fileInfo[0];
    const contentType = file.contentType || 'application/octet-stream';

    const downloadStream = mediaStorage.bucket.openDownloadStream(objectId);

    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      return res.status(404).json({ success: false, message: 'File not found' });
    });

    // Set appropriate headers for file streaming with correct content type
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Access-Control-Allow-Origin': '*'
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving media:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /media/:id
 * Delete a specific media file and remove its reference from user profile
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mediaStorage.bucket) {
      return res.status(500).json({ success: false, message: 'Storage not initialized' });
    }

    const fileId = req.params.id;
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    // Delete file from GridFS
    await mediaStorage.bucket.delete(objectId);

    // Remove reference from user's profile
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { $or: [
        { images: fileId },
        { videos: fileId }
      ]},
      { 
        $pull: { 
          images: fileId,
          videos: fileId 
        }
      },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'File reference not found in any profile' 
      });
    }

    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
});

// Add video upload route
router.post(
  '/video-upload-subscriber',
  auth,
  async (req, res) => {
    const { base64Data, filename, contentType, userId } = req.body;

    if (!base64Data || !filename || !contentType || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: {
          base64Data: !base64Data,
          filename: !filename,
          contentType: !contentType,
          userId: !userId
        }
      });
    }

    try {
      // Validate video content type
      if (!contentType.startsWith('video/')) {
        throw new Error('Invalid content type. Must be a video file.');
      }

      // Upload file to GridFS
      const fileId = await mediaStorage.uploadBase64Media(base64Data, filename, contentType);
      
      // Update user profile with video ID
      const updatedProfile = await UserProfile.findByIdAndUpdate(
        userId,
        {
          subscriberVideo: {
            url: fileId.toString(),
            uploadedAt: new Date(),
            title: filename,
            description: ''
          }
        },
        { new: true }
      );

      if (!updatedProfile) {
        throw new Error('Failed to update user profile with video');
      }

      res.status(200).json({
        success: true,
        fileId: fileId.toString(),
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack
      });
    }
  }
);

export default router;
