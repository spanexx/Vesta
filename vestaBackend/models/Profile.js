import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 500,
    validate: {
      validator: function(v) {
        // Basic profanity filter
        return !/\[badword\]/gi.test(v);
      },
      message: 'Bio contains restricted content'
    }
  },
  services: {
    type: [String],
    enum: [
      'incall',
      'outcall',
      'GFE',
      'PSE',
      'social-companionship',
      'travel-companion',
      'erotic-massage'
    ],
  },
  level: {
    type: String,
    enum: ['vip', 'regular']
  },
  rates: {
    incall: {
      type: Map,
      of: Number,
    },
    outcall: {
      type: Map,
      of: Number,
    }
  },
  physicalAttributes: {
    gender: {
      type: String,
      enum: ['female', 'male', 'trans', 'non-binary'],
    },
    birthdate: Date,
    height: Number,
    weight: Number,
    ethnicity: String,
    bustSize: String,
    bustType: String,
    pubicHair: String,
    tattoos: Boolean,
    piercings: Boolean
  },
  availabileToMeet: {
    meetingWith: {
      type: [String],
      enum: ['men', 'women', 'couples', 'trans']
    },
    available24_7: Boolean,
    advanceBooking: Boolean
  },
  contact: {
    phone: String,
    country: String,
    city: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      }
    }
  },
  workingTime: String,
  availability: {
    schedule: {
      type: Map,
      of: Boolean,
    },
    timezone: {
      type: String,
    }
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  moderationFlags: {
    contentWarnings: Number,
    lastReviewed: Date,
    reviewerNotes: String
  },
  verificationDocuments: [String]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for searchable fields
profileSchema.index({
  bio: 'text',
  services: 'text'
});

profileSchema.statics.createProfile = async function(userId, birthdate, profileData) {
  const profile = new this({
    user: userId,
    birthdate, 
    ...profileData
  });
  return await profile.save();
};

export default mongoose.model('Profile', profileSchema);