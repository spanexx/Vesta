import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { type } from 'os';

const userProfileSchema = new mongoose.Schema({

  // ----- User Fields -----
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Invalid email format'
    ],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  birthdate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        const age = new Date().getFullYear() - v.getFullYear();
        return age >= 18;
      },
      message: 'User must be at least 18 years old',
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending',
  },
  role: {
    type: [String],  // Changed from String to [String] for array support
    enum: ['girlfriend', 'wife', 'mistress', 'pornstar', 'onenight'],
    default: ['onenight']
  },
 
  lastLogin: Date,
  verificationDocuments: [{
    data: { type: String, required: true },
    side: { 
      type: String,
      enum: ['front', 'back'],
      required: true 
    },
    uploadedAt: { 
      type: Date,
      default: Date.now 
    }
  }],
  emergencyContact: {
    name: { type: String },
    phoneNumber: { type: String },
    relationship: { type: String },
  },

  // ----- Profile Fields -----
  fullName: {
    type: String,
    trim: true,
  },
  // The username field is already defined above.
  bio: {
    type: String,
    trim: true,
  },
  userlikes: {
    type: Number,
    default: 0,
  },
  viewerlikes: {
    type: Number,
    default: 0,
  },
  services: {
    included: {
      type: [String],
      enum: [
        // Basic Services
        'Classic vaginal sex', 'Sex Toys', 'Striptease', 'Uniforms', '69 position', 
        'Cum in face', 'Cum in mouth', 'Cum on body', 'Deepthroat', 'Domination', 
        'Erotic massage', 'Erotic Photos', 'Foot fetish', 'French kissing', 
        'Golden shower give', 'Group sex', 'Oral without condom', 'With 2 men',
        // Pornstar Services
        'Video Recording', 'Photo Shooting', 'Live Cam Show', 'Adult Film Production',
        'Private Show', 'Professional Photos', 'Explicit Content Creation',
        // Mistress Services
        'BDSM', 'Role Play', 'Spanking', 'Bondage', 'Fetish', 'Slave Training',
        'Discipline', 'Humiliation', 'Rope Play', 'Wax Play',
        // Girlfriend Experience
        'Dinner Date', 'Overnight Stay', 'Weekend Trip', 'Social Events',
        'Romantic Evening', 'Cuddling', 'Dating', 'Travel Companion',
        'Dancing', 'Shopping Together'
      ],
      default: []
    },
    extra: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  rates: {
    incall: {
      type: Map,
      of: Number,
      default: new Map()
    },
    outcall: {
      type: Map,
      of: Number,
      default: new Map()
    },
    currency: {
      type: String,
      default: 'EUR'
    }
  },  physicalAttributes: {    gender: { 
      type: String, 
      trim: true,
      enum: ['female', 'male', 'trans'],
      default: 'female'
    },
    height: { 
      type: Number, 
      min: 140, // Minimum realistic height in cm
      max: 220, // Maximum realistic height in cm
      default: 165
    },
    weight: { 
      type: Number, 
      min: 35, // Minimum realistic weight in kg
      max: 150, // Maximum realistic weight in kg
      default: 55
    },
    ethnicity: { 
      type: String, 
      trim: true,
      enum: ['Asian', 'Black', 'Caucasian', 'Hispanic', 'Indian', 'Middle Eastern', 'Mixed', 'Other'],
      default: 'Other'
    },
    bustSize: { 
      type: String, 
      trim: true,
      match: [/^[0-9]{2}[A-K]$/, 'Please enter a valid bust size (e.g., 34C)']
    },
    bustType: { 
      type: String, 
      trim: true,
      enum: ['Natural', 'Enhanced'],
      default: 'Natural'
    },
    pubicHair: { 
      type: String, 
      trim: true,
      enum: ['Shaved', 'Trimmed', 'Natural'],
      default: 'Shaved'
    },
    tattoos: { 
      type: Boolean, 
      default: false 
    },
  piercings: {
      type: Boolean, 
      default: false 
    },
    // Additional physical attributes
    hairColor: {
      type: String,
      trim: true,
      enum: ['Blonde', 'Brown', 'Black', 'Red', 'Auburn', 'Grey', 'White', 'Colorful', 'Other'],
      default: 'Other'
    },
    eyeColor: {
      type: String,
      trim: true,
      enum: ['Blue', 'Green', 'Brown', 'Hazel', 'Grey', 'Amber', 'Other'],
      default: 'Other'
    },
    bodyType: {
      type: String,
      trim: true,
      enum: ['Slim', 'Athletic', 'Average', 'Curvy', 'Full-figured', 'Muscular', 'Petite'],
      default: 'Average'
    },
    skinTone: {
      type: String,
      trim: true,
      enum: ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Dark'],
      default: 'Medium'
    },
    waistSize: {
      type: Number,
      min: 50, // Minimum realistic waist size in cm
      max: 150, // Maximum realistic waist size in cm
    },
    hipSize: {
      type: Number,
      min: 70, // Minimum realistic hip size in cm
      max: 170, // Maximum realistic hip size in cm
    },
    smoker: {
      type: String,
      enum: ['Non-smoker', 'Occasional', 'Regular'],
      default: 'Non-smoker'
    },
    drinker: {
      type: String,
      enum: ['Non-drinker', 'Social', 'Regular'],
      default: 'Social'
    },
    languages: {
      type: [String],
      default: []
    },
    nationality: {
      type: String,
      trim: true
    }
  },
  availableToMeet: {
    meetingWith: { type: [String], default: [] },
    available24_7: { type: Boolean, default: false },
    advanceBooking: { type: Boolean, default: false },
  },
  contact: {
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    whatsapp: {
      type: String,
      validate: {
        validator: function(v) {
          // Validate phone number format (basic validation)
          return /^\+?[\d\s-]+$/.test(v);
        },
        message: props => `${props.value} is not a valid WhatsApp number!`
      }
    },
  },
  // Use a different field name for the profile level to distinguish it
  profileLevel: {
    type: String,
    enum: ['free', 'standard', 'premium', 'vip'],
    default: 'free',
  },
  subscription: {
    stripeSubscriptionId: String,
    startDate: { type: Date },
    currentPeriodEnd: Date,
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired'],
      default: 'expired'
    }
  },
  videoSubscription: {
    isSubscribed: { type: Boolean, default: false },
    subscribedAt: Date,
    expiresAt: Date,
  },
  subscriberVideo: {
    url: String,
    uploadedAt: Date,
    title: String,
    description: String,
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }]
  },
  workingTime: {
    type: String,
    trim: true,
  },
  termsAccepted: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'reviewing', 'verified', 'rejected'],
    default: 'pending',
  },
  moderationFlags: {
    contentWarnings: { type: Number, default: 0 },
    lastReviewed: { type: Date },
    reviewerNotes: { type: String, trim: true },
    flaggedMedia: [{
      mediaId: { type: String },
      mediaType: { type: String, enum: ['image', 'video'] },
      reason: { type: String },
      flaggedAt: { type: Date, default: Date.now }
    }]
  },
  images: {
    type: [String],
    default: [],
  },
  videos: {
    type: [String],
    default: [],
  },
  profilePicture: {
    type: String,
    default: null
  },
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  likedProfiles: {
    userLikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }],
    viewerLikes: [{ type: String }] // Store anonymous IDs for viewer likes
  },
}, { timestamps: true });

// Geospatial index for proximity queries
userProfileSchema.index({ 'contact.location': '2dsphere' });
userProfileSchema.index({ 'contact.country': 'text', 'contact.city': 'text' });

// Pre-save middleware to hash the password if it’s modified
userProfileSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    if (!this.password) {
      return next(new Error('Password is required'));
    }
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Static method to create a new user profile
userProfileSchema.statics.createProfile = async function (profileData) {
  const userProfile = new this(profileData);
  return await userProfile.save();
};

// Static method to update an existing user profile
userProfileSchema.statics.updateProfile = async function (userId, profileData) {
  // This method updates the profile while maintaining the existing record
  const updatedProfile = await this.findOneAndUpdate(
    { _id: userId },
    { $set: profileData },
    { new: true, runValidators: true }
  );
  return updatedProfile;
};

userProfileSchema.statics.updateField = async function(userId, fieldName, value) {
  // Create the update object dynamically
  let updateObj = {};
  updateObj[fieldName] = value;

  console.log('Updating profile:', { userId, fieldName, value }); // Debug log

  // Special handling for arrays
  if (Array.isArray(value)) {
    return this.findByIdAndUpdate(
      userId,
      { $set: updateObj },
      { 
        new: true, 
        runValidators: true,
        arrayFilters: [] // Ensure array updates are handled properly
      }
    );
  }

  // Special handling for services
  if (fieldName === 'services') {
    updateObj = {
      'services.included': value.included,
      'services.extra': value.extra
    };
  }

  const updatedProfile = await this.findByIdAndUpdate(
    userId,
    { $set: updateObj },
    { 
      new: true, 
      runValidators: true 
    }
  );

  if (!updatedProfile) {
    throw new Error('Profile not found');
  }

  return updatedProfile;
};

userProfileSchema.statics.incrementUserLikes = async function(profileId, likerId) {
  // Check if user has already liked this profile
  const likerProfile = await this.findById(likerId);
  if (likerProfile.likedProfiles.userLikes.includes(profileId)) {
    return null; // Already liked
  }

  // Add like and update liker's profile
  const [updatedProfile] = await Promise.all([
    this.findByIdAndUpdate(
      profileId,
      { $inc: { userlikes: 1 } },
      { new: true }
    ),
    this.findByIdAndUpdate(
      likerId,
      { $push: { 'likedProfiles.userLikes': profileId } }
    )
  ]);

  return updatedProfile;
};

userProfileSchema.statics.incrementViewerLikes = async function(profileId, anonymousId) {
  // Check if anonymous user has already liked this profile
  const profile = await this.findOne({
    _id: profileId,
    'likedProfiles.viewerLikes': anonymousId
  });

  if (profile) {
    return null; // Already liked
  }

  return this.findByIdAndUpdate(
    profileId,
    {
      $inc: { viewerlikes: 1 },
      $push: { 'likedProfiles.viewerLikes': anonymousId }
    },
    { new: true }
  );
};

userProfileSchema.statics.updateImages = async function(userId, images) {
  return this.findByIdAndUpdate(
    userId,
    { $addToSet: { images: { $each: images } } }, // Append new images
    { new: true, runValidators: true }
  );
};

userProfileSchema.statics.updateVideos = async function(userId, videos) {
  return this.findByIdAndUpdate(
    userId,
    { $addToSet: { videos: { $each: videos } } }, // Append new videos
    { new: true, runValidators: true }
  );
};

// Static method to update profile picture
userProfileSchema.statics.updateProfilePicture = async function(userId, profilePicture) {
  return this.findByIdAndUpdate(
    userId,
    { $set: { profilePicture } },
    { new: true, runValidators: true }
  );
};

// Update the likeVideo static method
userProfileSchema.statics.likeVideo = async function(videoOwnerId, likerId) {
  try {
    console.log('Attempting to like video:', { videoOwnerId, likerId });
    
    // Handle anonymous likes
    if (likerId === 'anonymous') {
      return this.findByIdAndUpdate(
        videoOwnerId,
        { $inc: { 'subscriberVideo.anonymousLikes': 1 } },
        { new: true }
      );
    }

    // Look up the profile first to verify it exists
    const profile = await this.findById(videoOwnerId);
    if (!profile) {
      console.log('Profile not found');
      return null;
    }
    
    // If video doesn't exist, return null
    if (!profile.subscriberVideo) {
      console.log('No video found');
      return null;
    }

    // Initialize likedBy array if it doesn't exist
    if (!profile.subscriberVideo.likedBy) {
      profile.subscriberVideo.likedBy = [];
      profile.subscriberVideo.likes = 0;
    }

    // Check if already liked
    const alreadyLiked = profile.subscriberVideo.likedBy.includes(likerId);
    if (alreadyLiked) {
      console.log('Already liked');
      return profile; // Return current state if already liked
    }

    // Update the profile with the new like
    const updatedProfile = await this.findByIdAndUpdate(
      videoOwnerId,
      { 
        $inc: { 'subscriberVideo.likes': 1 },
        $push: { 'subscriberVideo.likedBy': likerId }
      },
      { new: true }
    );

    console.log('Like result:', updatedProfile ? 'Success' : 'Failed');
    return updatedProfile;
  } catch (error) {
    console.error('Error in likeVideo:', error);
    throw error;
  }
};

// Add unlike method
userProfileSchema.statics.unlikeVideo = async function(videoOwnerId, likerId) {
  const profile = await this.findOneAndUpdate(
    { 
      _id: videoOwnerId,
      'subscriberVideo.likedBy': likerId 
    },
    { 
      $inc: { 'subscriberVideo.likes': -1 },
      $pull: { 'subscriberVideo.likedBy': likerId }
    },
    { new: true }
  );
  return profile;
};

userProfileSchema.statics.deleteField = async function(userId, fieldName) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate field name to prevent deleting critical fields
    const protectedFields = ['_id', 'user', 'role', 'createdAt', 'updatedAt'];
    if (protectedFields.includes(fieldName)) {
      throw new Error('Cannot delete protected field');
    }

    const updateQuery = { $unset: { [fieldName]: 1 } };
    const profile = await this.findByIdAndUpdate(
      userId,
      updateQuery,
      { 
        new: true,
        runValidators: true,
        session 
      }
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    await session.commitTransaction();
    return profile;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

userProfileSchema.statics.deleteRate = async function(userId, duration) {
  return this.findByIdAndUpdate(
    userId,
    { 
      $unset: {
        [`rates.incall.${duration}`]: 1,
        [`rates.outcall.${duration}`]: 1
      }
    },
    { 
      new: true, 
      runValidators: true 
    }
  );
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
