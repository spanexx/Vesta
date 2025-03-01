const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: Buffer
  },
  video: {
    type: Buffer
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);