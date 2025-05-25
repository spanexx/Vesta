const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const UserProfile = require('../models/UserProfile.js'); // Assuming UserProfile.js is in models
const { auth } = require('../middleware/auth.js'); // Assuming auth middleware for user ID validation

// Simple error response utility if not defined elsewhere
const createErrorResponse = (res, statusCode, errorCode, message) => {
  return res.status(statusCode).json({
    error: errorCode,
    message: message
  });
};

const upload = multer({ dest: './uploads/' }); // This might be for a different type of upload

// Document upload endpoints
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    // Upload document logic - this is likely for multipart/form-data, not base64
    res.json({ message: 'Document uploaded successfully (Note: This is likely not the base64 endpoint)' });
  } catch (error) {
    createErrorResponse(res, 500, 'DOCUMENT_UPLOAD_FAILED', 'Document upload failed');
  }
});

// New Base64 Document Upload Endpoint
router.post('/users/:userId/verification-document-base64', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { base64Data, side, contentType, filename } = req.body;

    // Basic validation
    if (!userId || !base64Data || !side || !contentType || !filename) {
      return createErrorResponse(res, 400, 'MISSING_FIELDS', 'Required fields are missing.');
    }
    if (req.user._id.toString() !== userId) {
        return createErrorResponse(res, 403, 'FORBIDDEN', 'User ID does not match authenticated user.');
    }

    const validSides = ['front', 'back'];
    if (!validSides.includes(side)) {
      return createErrorResponse(res, 400, 'INVALID_SIDE', 'Invalid document side specified.');
    }

    // Sanitize filename (basic example)
    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
    if (!sanitizedFilename) {
        return createErrorResponse(res, 400, 'INVALID_FILENAME', 'Invalid filename provided.');
    }

    // Create user-specific directory
    const userUploadDir = path.join(__dirname, '../../uploads/verification_documents', userId);
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    // Convert base64 to buffer
    let imageBuffer;
    if (base64Data.includes(',')) {
      imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
    } else {
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    
    const uniqueFilename = `${Date.now()}_${sanitizedFilename}`;
    const relativeFilePath = `verification_documents/${userId}/${uniqueFilename}`; // Path to store in DB
    const absoluteFilePath = path.join(__dirname, '../../uploads', relativeFilePath);


    // Save file
    fs.writeFileSync(absoluteFilePath, imageBuffer);

    // Find user profile
    const userProfile = await UserProfile.findById(userId);
    if (!userProfile) {
      return createErrorResponse(res, 404, 'USER_NOT_FOUND', 'User profile not found.');
    }

    // Update verificationDocuments
    // Remove existing document for the same side
    userProfile.verificationDocuments = userProfile.verificationDocuments.filter(doc => doc.side !== side);
    
    // Add new document
    userProfile.verificationDocuments.push({
      data: relativeFilePath, // Store relative path
      side: side,
      uploadedAt: new Date(),
      contentType: contentType,
      originalFilename: filename // Store original filename if needed
    });

    // Determine verification status
    const hasFront = userProfile.verificationDocuments.some(doc => doc.side === 'front');
    const hasBack = userProfile.verificationDocuments.some(doc => doc.side === 'back');

    if (hasFront && hasBack) {
      userProfile.verificationStatus = 'reviewing';
    } else {
      userProfile.verificationStatus = 'pending';
    }
    userProfile.verified = false; // Reset verified status until admin approves

    await userProfile.save();

    res.status(200).json({
      message: 'Document uploaded successfully.',
      verificationStatus: userProfile.verificationStatus,
      documents: userProfile.verificationDocuments
    });

  } catch (error) {
    console.error('Error uploading verification document:', error);
    createErrorResponse(res, 500, 'UPLOAD_ERROR', `Failed to upload document: ${error.message}`);
  }
});


// Third-party verification integration
router.post('/verify-identity', async (req, res) => {
  try {
    const Onfido = require('onfido');
    const onfido = new Onfido('api_sandbox.0nVJJkepm6W.IAWGSPV7ZNHBiEr_iaM7CR4QsgCYdkGr'); // Replace with actual API key if used
    
    // This is a placeholder and likely needs proper implementation if Onfido is used.
    // For now, it's not directly related to the base64 upload for manual verification.
    onfido.applicant.create({ /* applicant details */ }, (error, applicant) => {
      if (error) return createErrorResponse(res, 500, 'ONFIDO_ERROR', error.message);

      onfido.check.create({
        applicantId: applicant.id,
        reportNames: ['document', 'facial_similarity_photo']
      }, (error, check) => {
        if (error) return createErrorResponse(res, 500, 'ONFIDO_ERROR', error.message);
        res.json({ message: 'Onfido check initiated successfully', checkId: check.id });
      });
    });
  } catch (error) {
    console.error('Onfido verification error:', error);
    createErrorResponse(res, 500, 'IDENTITY_VERIFICATION_FAILED', 'Identity verification failed');
  }
});

module.exports = router;