const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './uploads/' });

// Document upload endpoints
router.post('/upload-document', upload.single('document'), async (req, res) => {
  try {
    // Upload document logic
    res.json({ message: 'Document uploaded successfully' });
  } catch (error) {
    createErrorResponse(res, 500, 'DOCUMENT_UPLOAD_FAILED', 'Document upload failed');
  }
});

// Third-party verification integration
router.post('/verify-identity', async (req, res) => {
  try {
    const Onfido = require('onfido');
    const onfido = new Onfido('api_sandbox.0nVJJkepm6W.IAWGSPV7ZNHBiEr_iaM7CR4QsgCYdkGr');
    
    onfido.createCheck({
      // Add applicant details
    }, (error, response) => {
      if (error) {
        createErrorResponse(res, 500, 'IDENTITY_VERIFICATION_FAILED', 'Identity verification failed');
      } else {
        res.json({ message: 'Identity verification initiated successfully' });
      }
    });
  } catch (error) {
    createErrorResponse(res, 500, 'IDENTITY_VERIFICATION_FAILED', 'Identity verification failed');
  }
});

module.exports = router;