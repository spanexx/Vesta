import express from 'express';
import mongoose from 'mongoose';
import UserProfile from '../models/UserProfile.js';
import auth from '../middleware/auth.js';
import createErrorResponse from '../utils/errorHandler.js';
import multer from 'multer';
import path from 'path';
import { GridFsStorage } from 'multer-gridfs-storage';
import Grid from 'gridfs-stream';
import dotenv from 'dotenv';

dotenv.config();


// Create GridFS stream
let gfs;
mongoose.connection.once('open', () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Update the storage configuration
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: `${Date.now()}-${file.originalname}`,
        bucketName: 'uploads'
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });

const router = express.Router();

// Update profile using the UserProfile static method
router.post('/update', auth, async (req, res) => {
  try {
    const profileData = {
      user: req.userId,
      fullName: req.body.fullName,      // Added fullName
      username: req.body.username,      // Added username
      bio: req.body.bio,
      services: {
        included: req.body.services.included || [],
        extra: req.body.services.extra || {}
      },
      rates: {
        incall: req.body.rates.incall,
        outcall: req.body.rates.outcall
      },
      physicalAttributes: {
        gender: req.body.physicalAttributes.gender,
        birthdate: req.body.physicalAttributes.birthdate,
        height: req.body.physicalAttributes.height,
        weight: req.body.physicalAttributes.weight,
        ethnicity: req.body.physicalAttributes.ethnicity,
        bustSize: req.body.physicalAttributes.bustSize,
        bustType: req.body.physicalAttributes.bustType,
        pubicHair: req.body.physicalAttributes.pubicHair,
        tattoos: req.body.physicalAttributes.tattoos,
        piercings: req.body.physicalAttributes.piercings
      },
      availableToMeet: {
        meetingWith: req.body.availableToMeet.meetingWith,
        available24_7: req.body.availableToMeet.available24_7,
        advanceBooking: req.body.availableToMeet.advanceBooking
      },
      contact: {
        phone: req.body.contact.phone,
        country: req.body.contact.country,
        city: req.body.contact.city,
        location: req.body.contact.location && {
          type: 'Point',
          coordinates: [
            parseFloat(req.body.contact.location.coordinates[0]),
            parseFloat(req.body.contact.location.coordinates[1])
          ]
        }
      },
      workingTime: req.body.workingTime,
      termsAccepted: req.body.termsAccepted,
      verificationStatus: req.body.verificationStatus,
      moderationFlags: {
        contentWarnings: req.body.moderationFlags.contentWarnings,
        lastReviewed: req.body.moderationFlags.lastReviewed,
        reviewerNotes: req.body.moderationFlags.reviewerNotes
      },
      verificationDocuments: req.body.verificationDocuments,
      profileLevel: req.body.profileLevel, 
      images: req.body.images,
      videos: req.body.videos
    };

    if (!profileData.termsAccepted) {
      return createErrorResponse(
        res,
        400,
        'TERMS_NOT_ACCEPTED',
        'Must accept terms of service'
      );
    }

    // Check if the user profile exists
    const userProfile = await UserProfile.findById(req.userId);
    if (!userProfile) {
      return createErrorResponse(
        res,
        404,
        'USER_NOT_FOUND',
        'User not found'
      );
    }

    // Use the static updateProfile method on the UserProfile model
    const updatedProfile = await UserProfile.updateProfile(req.userId, profileData);
    res.json(updatedProfile);
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'PROFILE_UPDATE_FAILED',
      'Profile update failed',
      error
    );
  }
});

// Update profile picture
router.put('/profile-picture', auth, async (req, res) => {
  try {
    const { pictureUrl } = req.body;
    
    if (!pictureUrl) {
      return createErrorResponse(
        res,
        400,
        'INVALID_INPUT',
        'Profile picture URL is required'
      );
    }

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      req.userId,
      { profilePicture: pictureUrl },
      { new: true }
    );

    if (!updatedProfile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }

    res.json(updatedProfile);
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'UPDATE_FAILED',
      'Failed to update profile picture',
      error
    );
  }
});

// Update profile videos
router.put('/videos', auth, async (req, res) => {
  try {
    const { videos } = req.body;
    
    if (!Array.isArray(videos)) {
      return createErrorResponse(
        res,
        400,
        'INVALID_INPUT',
        'Videos must be an array of URLs'
      );
    }

    const updatedProfile = await UserProfile.updateVideos(req.userId, videos);

    if (!updatedProfile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }

    res.json(updatedProfile);
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'UPDATE_FAILED',
      'Failed to update profile videos',
      error
    );
  }
});

// Update profile images
router.put('/images', auth, async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!Array.isArray(images)) {
      return createErrorResponse(
        res,
        400,
        'INVALID_INPUT',
        'Images must be an array of URLs'
      );
    }

    const updatedProfile = await UserProfile.updateImages(req.userId, images);

    if (!updatedProfile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }

    res.json(updatedProfile);
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'UPDATE_FAILED',
      'Failed to update profile images',
      error
    );
  }
});

// Filter profiles by role
router.get('/filter', async (req, res) => {
  try {
    const role = req.query.role;
    if (!role) {
      return res.status(400).json({
        error: 'ROLE_REQUIRED',
        message: 'Role is required'
      });
    }
    console.log('Filtering profiles by role:', role);
    
    // Update query to search in the role array
    const profiles = await UserProfile.find({ role: { $in: [role] } });
    console.log(`Found ${profiles.length} profiles with role ${role}`);
    
    res.json(profiles);
  } catch (error) {
    console.error('Error filtering profiles:', error);
    res.status(500).json({
      error: 'FILTER_PROFILES_FAILED',
      message: 'Failed to filter profiles'
    });
  }
});

// Filter profiles by location
router.get('/location', async (req, res) => {
  try {
    const { country, city } = req.query;
    const query = {};
    console.log("Country", country);
    console.log("City", city);
    
    if (country) query['contact.country'] = { $regex: country, $options: 'i' };
    if (city) query['contact.city'] = { $regex: city, $options: 'i' };
    
    if (!country && !city) {
      return res.status(400).json({
        error: 'LOCATION_PARAM_REQUIRED',
        message: 'At least one location parameter (country or city) is required'
      });
    }

    const profiles = await UserProfile.find(query);
    res.json(profiles);
  } catch (error) {
    // Error handling
  }
});

// Get all profiles with optional filters and sorting
router.get('/profiles', async (req, res) => {
  try {
    const query = {};
  
    // Handle location query
    if (req.query.coordinates) {
      const [longitude, latitude] = Array.isArray(req.query.coordinates) 
        ? req.query.coordinates.map(Number)
        : req.query.coordinates.split(',').map(Number);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        query['contact.location'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            }
          }
        };
      }
    }

    // Handle age query
    if (req.query.age && !isNaN(req.query.age)) {
      const age = parseInt(req.query.age);
      const today = new Date();
      const minBirthdate = new Date(today.getFullYear() - age - 1, today.getMonth(), today.getDate());
      const maxBirthdate = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
      
      query.birthdate = {
        $gte: minBirthdate,
        $lt: maxBirthdate
      };
    }

    // Handle services query
    if (req.query.services && req.query.services !== 'undefined') {
      const services = Array.isArray(req.query.services) 
        ? req.query.services 
        : req.query.services.split(',');
      query['services.included'] = { $in: services };
    }

    const profiles = await UserProfile.find(query);
    
    // Sort profiles by level and distance if location provided
    if (req.query.coordinates) {
      profiles.sort((a, b) => {
        // First sort by profile level
        const levels = { vip: 3, premium: 2, standard: 1 };
        const levelDiff = (levels[b.profileLevel] || 0) - (levels[a.profileLevel] || 0);
        if (levelDiff !== 0) return levelDiff;
        
        // Then by distance if same level
        return 0; // Distance calculation can be added here if needed
      });
    }

    res.json(profiles);
  } catch (error) {
    console.error('Error getting profiles:', error);
    res.status(500).json({ error: 'GET_PROFILES_FAILED', message: 'Failed to get profiles' });
  }
});

// Get public profile
router.get('/:id', async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id)
      .select('-__v')
      .lean();
    if (!profile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }

    res.json(profile);
  } catch (error) {
    console.error('Error getting public profile:', error);
    createErrorResponse(
      res,
      500,
      'SERVER_ERROR',
      'Error retrieving profile',
      error
    );
  }
});

// Add user like to profile
router.post('/:id/like/user', auth, async (req, res) => {
  try {
    const profile = await UserProfile.incrementUserLikes(req.params.id);
    if (!profile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }
    res.json({ userlikes: profile.userlikes });
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'LIKE_UPDATE_FAILED',
      'Failed to update user likes',
      error
    );
  }
});

// Add viewer like to profile
router.post('/:id/like/viewer', async (req, res) => {
  try {
    const profile = await UserProfile.incrementViewerLikes(req.params.id);
    if (!profile) {
      return createErrorResponse(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'Profile not found'
      );
    }
    res.json({ viewerlikes: profile.viewerlikes });
  } catch (error) {
    createErrorResponse(
      res,
      500,
      'LIKE_UPDATE_FAILED',
      'Failed to update viewer likes',
      error
    );
  }
});

// Update individual field
router.patch('/field/:fieldName', auth, async (req, res) => {
  try {
    const { fieldName } = req.params;
    const { value } = req.body;
    console.log('Updating field:', fieldName, 'with value:', value);

    // Create update object before validation
    const updateData = {};

    // Basic validation
    if (value === undefined) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Value is required'
      });
    }

    // Special handling for role field and physical attributes
    if (fieldName === 'role') {
      if (!Array.isArray(value)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'Role must be an array'
        });
      }
      // Validate role values
      const validRoles = ['girlfriend', 'wife', 'mistress', 'pornstar', 'onenight'];
      if (!value.every(role => validRoles.includes(role))) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'Invalid role values'
        });
      }
      updateData[fieldName] = value; // Ensure we're setting the entire array
      console.log('Setting roles to:', value); // Debug log
    } else if (fieldName === 'physicalAttributes.ethnicity') {
      const normalizedValue = value.toLowerCase().trim();
      // Allow any value but suggest preferred values
      if (normalizedValue.length < 2 || normalizedValue.length > 50) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'Ethnicity must be between 2 and 50 characters'
        });
      }
      updateData['physicalAttributes.ethnicity'] = normalizedValue;
    } else if (fieldName === 'services') {
      if (!value.included || !Array.isArray(value.included)) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'Services included must be an array'
        });
      }
      if (!value.extra || typeof value.extra !== 'object') {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'Services extra must be an object'
        });
      }
      updateData[fieldName] = value;
    } else {
      updateData[fieldName] = value;
    }

    const updatedProfile = await UserProfile.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Field update error:', error);
    res.status(500).json({
      error: 'FIELD_UPDATE_FAILED',
      message: 'Failed to update field',
      details: error.message
    });
  }
});

// Update images
router.put('/:userId/images', async (req, res) => {
  try {
    const updatedProfile = await UserProfile.updateImages(req.params.userId, req.body.images);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update videos
router.put('/:userId/videos', async (req, res) => {
  try {
    const updatedProfile = await UserProfile.updateVideos(req.params.userId, req.body.videos);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update profile picture
router.put('/:userId/profilePicture', async (req, res) => {
  try {
    const updatedProfile = await UserProfile.updateProfilePicture(req.params.userId, req.body.profilePicture);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


export default router;
