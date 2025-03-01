import express from 'express';
import auth from '../middleware/auth.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import createErrorResponse from '../utils/errorHandler.js';

// update profile
const router = express.Router();
router.post('/update', auth, async (req, res) => {
  try {
    const profileData = {
      user: req.userId,
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
          coordinates: [parseFloat(req.body.contact.location.coordinates[0]), parseFloat(req.body.contact.location.coordinates[1])]
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
      verificationDocuments: req.body.verificationDocuments
    };
    console.warn('Request Body: ', req.body.contact.location)
    if (!profileData.termsAccepted) {
      return createErrorResponse(res, 400, 'TERMS_NOT_ACCEPTED', 'Must accept terms of service');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return createErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    const profile = await Profile.findOneAndUpdate({ user: req.userId }, profileData, { new: true, upsert: true }).catch((error) => {
      createErrorResponse(res, 500, 'PROFILE_UPDATE_FAILED', 'Profile update failed', error);
    });

    res.json(profile);
  } catch (error) {
    createErrorResponse(res, 500, 'PROFILE_UPDATE_FAILED', 'Profile update failed', error);
  }
});

// Filter profiles by service type
router.get('/filter', async (req, res) => {
  try {
    const serviceType = req.query.serviceType;
    if (!serviceType) {
      return createErrorResponse(res, 400, 'SERVICE_TYPE_REQUIRED', 'Service type is required');
    }
    const profiles = await Profile.find({ services: { $in: [serviceType] } });
    res.json(profiles);
  } catch (error) {
    createErrorResponse(res, 500, 'FILTER_PROFILES_FAILED', 'Failed to filter profiles', error);
  }
});

// Filter profiles by location
router.get('/location', async (req, res) => {
  try {
    const location = req.query.location;
    if (!location) {
      return createErrorResponse(res, 400, 'LOCATION_REQUIRED', 'Location is required');
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
    createErrorResponse(res, 500, 'FILTER_PROFILES_FAILED', 'Failed to filter profiles', error);
  }
});

// Get availability calendar
router.get('/availability', async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (!startDate || !endDate) {
      return createErrorResponse(res, 400, 'DATES_REQUIRED', 'Start and end dates are required');
    }
    const profiles = await Profile.find({ availability: { $elemMatch: { startDate: { $gte: startDate }, endDate: { $lte: endDate } } } });
    res.json(profiles);
  } catch (error) {
    createErrorResponse(res, 500, 'GET_AVAILABILITY_FAILED', 'Failed to get availability', error);
  }
});

// Get public profile
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'email verified')
      .select('-__v -user.password');

    if (!profile) return createErrorResponse(res, 404, 'PROFILE_NOT_FOUND', 'Profile not found');
    res.json(profile);
  } catch (error) {
    createErrorResponse(res, 500, 'SERVER_ERROR', 'Server error', error);
  }
});

export default router;