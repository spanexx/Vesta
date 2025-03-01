import AWS from 'aws-sdk';

/**
 * Content moderation service handling text and image validation
 */
export class ContentModerator {
  constructor() {
    this.textFilter = new RegExp(process.env.BANNED_WORDS_REGEX || '\\b(badword1|badword2)\\b', 'gi');
    
    if(process.env.AWS_ACCESS_KEY_ID) {
      this.rekognition = new AWS.Rekognition({
        region: process.env.AWS_REGION
      });
    }
  }

  /**
   * Scan text for inappropriate content
   * @param {string} text - Input text to scan
   * @returns {Promise<{isClean: boolean, violations: string[]}>}
   */
  async scanText(text) {
    const violations = [];
    
    // Basic regex filter
    const regexMatches = [...text.matchAll(this.textFilter)];
    if(regexMatches.length > 0) {
      violations.push('Contains prohibited terms');
    }
    
    // TODO: Add API-based scanning when configured
    return {
      isClean: violations.length === 0,
      violations
    };
  }

  /**
   * Moderate image using AWS Rekognition
   * @param {Buffer} imageBuffer - Image data buffer
   * @returns {Promise<{isClean: boolean, moderationLabels: array}>}
   */
  async moderateImage(imageBuffer) {
    if(!this.rekognition) {
      throw new Error('AWS Rekognition not configured');
    }
    
    const params = {
      Image: { Bytes: imageBuffer },
      MinConfidence: 80
    };
    
    try {
      const data = await this.rekognition.detectModerationLabels(params).promise();
      return {
        isClean: data.ModerationLabels.length === 0,
        moderationLabels: data.ModerationLabels
      };
    } catch (error) {
      console.error('Rekognition error:', error);
      throw new Error('Content moderation failed');
    }
  }

  /**
   * Check if an image is allowed to be shared
   * @param {Buffer} imageBuffer - Image data buffer
   * @returns {Promise<{isAllowed: boolean, reason: string}>}
   */
  async checkImageSharing(imageBuffer) {
    const imageSize = imageBuffer.length;
    const maxAllowedSize = 1024 * 1024; // 1MB

    if (imageSize > maxAllowedSize) {
      return {
        isAllowed: false,
        reason: 'Image size exceeds the maximum allowed size'
      };
    }

    const imageType = await this.getImageType(imageBuffer);
    if (!this.isAllowedImageType(imageType)) {
      return {
        isAllowed: false,
        reason: `Image type ${imageType} is not allowed`
      };
    }

    return {
      isAllowed: true,
      reason: 'Image is allowed to be shared'
    };
  }

  /**
   * Get the type of an image
   * @param {Buffer} imageBuffer - Image data buffer
   * @returns {Promise<string>}
   */
  async getImageType(imageBuffer) {
    // Implement image type detection logic here
    // For example, using a library like image-type
    const imageType = 'jpg'; // Replace with actual image type detection logic
    return imageType;
  }

  /**
   * Check if an image type is allowed
   * @param {string} imageType - Image type
   * @returns {boolean}
   */
  isAllowedImageType(imageType) {
    const allowedTypes = ['jpg', 'png', 'gif'];
    return allowedTypes.includes(imageType);
  }
}