import express from 'express';
import mongoose from 'mongoose'; // Add mongoose import
import mediaStorage from '../services/mediaStorage.js'; 
import UserProfile from '../models/UserProfile.js'; 
import checkUserStatus from '../middleware/checkStatus.js';
import checkUploadLimits from '../middleware/subscription-check.js';
import auth from '../middleware/auth.js';

const router = express.Router();

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
        console.warn(`Content type mismatch: declared ${contentType}, actual ${actualContentType}`);
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

    const downloadStream = mediaStorage.bucket.openDownloadStream(objectId);

    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      return res.status(404).json({ success: false, message: 'File not found' });
    });

    // Set appropriate headers for file streaming
    res.set({
      'Content-Type': 'application/octet-stream',
      'Transfer-Encoding': 'chunked'
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

export default router;
