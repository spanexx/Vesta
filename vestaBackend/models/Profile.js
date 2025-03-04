import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    trim: true,
    unique: true,
  },
  bio: {
    type: String,
    trim: true,
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
    birthdate: { type: Date },
    height: { type: Number, min: 0 }, // Height in cm
    weight: { type: Number, min: 0 }, // Weight in kg
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
      coordinates: { type: [Number], default: [0, 0] }
    }
  },
  level: {
    type: String,
    enum: ['standard', 'premium', 'vip'],
    default: 'standard',
  },
  workingTime: { type: String, trim: true },
  termsAccepted: { type: Boolean, default: false },
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
  verificationDocuments: { type: [String], default: [] },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
});

// Add a 2dsphere geospatial index for proximity queries
profileSchema.index({ 'contact.location': '2dsphere' });
// Profile.js (no modifications needed)
profileSchema.index({ 'contact.location': '2dsphere' });

// Static method to create a profile
profileSchema.statics.createProfile = async function (userId, birthdate, profileData) {
  const profile = new this({
    user: userId,
    birthdate,
    ...profileData,
  });
  return await profile.save();
};

// Static method to update a profile
profileSchema.statics.updateProfile = async function (userId, profileData) {
  const updatedProfile = await this.findOneAndUpdate(
    { user: userId },
    { $set: profileData },
    { new: true, runValidators: true }
  );
  return updatedProfile;
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;