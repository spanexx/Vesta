// mediaStorage.js
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

class MediaStorageService {
  constructor() {
    this.bucket = null;
    // Initialize the bucket once the mongoose connection is open.
    mongoose.connection.once('open', () => {
      this.bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'media'
      });
      console.log('GridFSBucket initialized');
    });
  }

  /**
   * Upload a media file to MongoDB GridFS.
   * @param {string} base64Data - The media file in Base64 format.
   * @param {string} filename - The original filename.
   * @param {string} contentType - The MIME type of the file.
   * @returns {Promise<ObjectId>} - The MongoDB file ID.
   */
  async uploadBase64Media(base64Data, filename, contentType) {
    if (!this.bucket) {
      throw new Error('Storage not initialized');
    }
    
    try {
      // Remove Base64 prefix if present
      const base64Content = base64Data.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      // Generate unique filename
      const uniqueFilename = `${uuidv4()}-${filename}`;

      return new Promise((resolve, reject) => {
        // Create upload stream
        const uploadStream = this.bucket.openUploadStream(uniqueFilename, {
          contentType,
          metadata: { originalFilename: filename }
        });

        // Handle upload stream errors
        uploadStream.on('error', (error) => {
          console.error('Upload stream error:', error);
          reject(error);
        });

        // Handle upload completion
        uploadStream.on('finish', function() {
          // 'this' refers to the GridFSBucketWriteStream
          if (!this.id) {
            reject(new Error('File upload failed - no file ID generated'));
            return;
          }
          resolve(this.id);
        });

        // Write buffer and end stream
        uploadStream.write(buffer);
        uploadStream.end();
      });
    } catch (error) {
      console.error('Media storage error:', error);
      throw error;
    }
  }
}

export default new MediaStorageService();
