const express = require('express');
const router = express.Router();
const { Message } = require('../models/Message');
const { User } = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const createErrorResponse = require('../utils/errorHandler');

// POST /messages
router.post('/', upload.any(), async (req, res) => {
  try {
    const { text, receiverId } = req.body;
    const sender = req.user;
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return createErrorResponse(res, 404, 'NOT_FOUND', 'Receiver not found');
    }
    let image;
    let video;
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'image') {
          image = file.buffer;
        } else if (file.fieldname === 'video') {
          video = file.buffer;
        }
      });
    }
    const message = new Message({ text, sender, receiver, image, video });
    await message.save();
    res.send('Message sent successfully');
  } catch (error) {
    createErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Error sending message', error);
  }
});

// GET /messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ sender: req.user }, { receiver: req.user }] });
    res.send(messages);
  } catch (error) {
    createErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Error retrieving messages', error);
  }
});

module.exports = router;