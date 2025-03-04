import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import auth from '../middleware/auth.js';
import createErrorResponse from '../utils/errorHandler.js';

const router = express.Router();

// update profile
router.post('/update', auth, async (req, res) => {
  try {
    const profileData = {
      user: req.userId,
      fullName: req.body.fullName,  // Added fullName
      username: req.body.username,  // Added username
      bio: req.body.bio,
      services: req.body.services,
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
      availabileToMeet: {
        meetingWith: req.body.availabileToMeet.meetingWith,
        available24_7: req.body.availabileToMeet.available24_7,
        advanceBooking: req.body.availabileToMeet.advanceBooking
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
      level: req.body.level,
      images: req.body.images,
      videos: req.body.videos
    };

    if (!profileData.termsAccepted) {
      return createErrorResponse(res, 400, 'TERMS_NOT_ACCEPTED', 'Must accept terms of service');
    }

    const user = await User.findById(req.userId);
    console.log()
    if (!user) {
      return createErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    // Use the static updateProfile method defined in the Profile model
    const updatedProfile = await Profile.updateProfile(req.userId, profileData);
    res.json(updatedProfile);
  } catch (error) {
    createErrorResponse(res, 500, 'PROFILE_UPDATE_FAILED', 'Profile update failed', error);
  }
});


// Filter profiles by service type
router.get('/filter', async (req, res) => {
  try {
    const serviceType = req.query.serviceType;
    if (!serviceType) {
      return res.status(400).json({ error: 'SERVICE_TYPE_REQUIRED', message: 'Service type is required' });
    }
    const profiles = await Profile.find({ services: { $in: [serviceType] } });
    res.json(profiles);
  } catch (error) {
    console.error('Error filtering profiles:', error);
    res.status(500).json({ error: 'FILTER_PROFILES_FAILED', message: 'Failed to filter profiles' });
  }
});

// Filter profiles by location
router.get('/location', async (req, res) => {
  try {
    const location = req.query.location;
    if (!location) {
      return res.status(400).json({ error: 'LOCATION_REQUIRED', message: 'Location is required' });
    }
    const profiles = await Profile.find({
      'contact.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          $maxDistance: 10000
        }
      }
    });
    res.json(profiles);
  } catch (error) {
    console.error('Error filtering profiles by location:', error);
    res.status(500).json({ error: 'FILTER_PROFILES_FAILED', message: 'Failed to filter profiles' });
  }
});

// Get all profiles
router.get('/profiles', async (req, res) => {
  try {
    const query = {};
    if (req.query.viewerLocation) {
      query['contact.city'] = req.query.location;
    }
    if (req.query.age) {
      const minAge = new Date().getFullYear() - req.query.age;
      const maxAge = new Date().getFullYear() - req.query.age + 1;
      query.birthdate = { $gte: new Date(minAge, 0, 1), $lt: new Date(maxAge, 0, 1) };
    }
    if (req.query.services) {
      query.services = { $in: [req.query.services] };
    }
    const profiles = await Profile.find(query);
    if (req.query.viewerLocation) {
      profiles.sort((a, b) => {
        if (a.level === 'vip' && b.level !== 'vip') {
          return -1;
        } else if (a.level === 'premium' && b.level !== 'premium' && b.level !== 'vip') {
          return -1;
        } else if (a.level === 'standard' && b.level !== 'standard' && b.level !== 'premium' && b.level !== 'vip') {
          return -1;
        } else {
          // Calculate distance between two points
          const distanceA = calculateDistance(a.contact.location.coordinates, req.query.viewerLocation);
          const distanceB = calculateDistance(b.contact.location.coordinates, req.query.viewerLocation);
          return distanceA - distanceB;
        }
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
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'email verified')
      .select('-__v -user.password');
    if (!profile) return res.status(404).json({ error: 'PROFILE_NOT_FOUND', message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    console.error('Error getting public profile:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Server error' });
  }
});

export default router;
