import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    type: String,
    enum: ['girlfriend', 'wife', 'mistress', 'pornstar', 'onenight'],
    default: 'onenight',
  },
  // To avoid confusion with profile level, we rename the user level field:
  accountLevel: {
    type: String,
    enum: ['vip', 'regular'],
  },
  lastLogin: Date,
  verificationDocuments: {
    type: [String],
    default: [],
  },
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
    type: [String],
    default: [],
  },
  rates: {
    incall: {
      '30 minutes': { type: Number, min: 0 },
      '1 hour': { type: Number, min: 0 },
    },
    outcall: {
      '30 minutes': { type: Number, min: 0 },
      '1 hour': { type: Number, min: 0 },
    },
  },
  physicalAttributes: {
    gender: { type: String, trim: true },
    // Note: birthdate is already included above.
    height: { type: Number, min: 0 }, // in cm
    weight: { type: Number, min: 0 }, // in kg
    ethnicity: { type: String, trim: true },
    bustSize: { type: String, trim: true },
    bustType: { type: String, trim: true },
    pubicHair: { type: String, trim: true },
    tattoos: { type: Boolean, default: false },
    piercings: { type: Boolean, default: false },
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
  },
  // Use a different field name for the profile level to distinguish it
  profileLevel: {
    type: String,
    enum: ['standard', 'premium', 'vip'],
    default: 'standard',
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
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  moderationFlags: {
    contentWarnings: { type: Number, default: 0 },
    lastReviewed: { type: Date },
    reviewerNotes: { type: String, trim: true },
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
  const updateObj = {};
  updateObj[fieldName] = value;

  // Perform the update
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

userProfileSchema.statics.incrementUserLikes = async function(profileId) {
  return this.findByIdAndUpdate(
    profileId,
    { $inc: { userlikes: 1 } },
    { new: true }
  );
};

userProfileSchema.statics.incrementViewerLikes = async function(profileId) {
  return this.findByIdAndUpdate(
    profileId,
    { $inc: { viewerlikes: 1 } },
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

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
