import express from 'express';
import {ContentModerator} from '../utils/contentModerator.js';

// Create a new ContentModerator instance
const moderator = new ContentModerator();
const router = express.Router();

// GET /moderation
router.get('/', (req, res) => {
  // Display moderation dashboard
  res.render('moderation');
});

// POST /moderation
router.post('/', async (req, res) => {
  // Handle user input and moderation actions
  try {
    const text = req.body.text;
    const image = req.body.image;

    if (text) {
      const result = await moderator.scanText(text);
      if (!result.isClean) {
        // Handle text moderation violations
        res.send('Text contains prohibited terms');
      } else {
        res.send('Text is clean');
      }
    } else if (image) {
      const result = await moderator.moderateImage(image);
      if (!result.isClean) {
        // Handle image moderation violations
        res.send('Image contains prohibited content');
      } else {
        res.send('Image is clean');
      }
    } else {
      res.send('No text or image provided');
    }
  } catch (error) {
    console.error('Moderation error:', error);
    res.send('Error occurred during moderation');
  }
});

export default router;