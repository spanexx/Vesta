import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import geoip from 'geoip-lite';
import UserProfile from '../models/UserProfile.js';
import createErrorResponse from '../utils/errorHandler.js';
import authMiddleware from '../middleware/auth.js';  // Add this import

const router = express.Router();

// User registration with age verification
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, birthdate, currentLocation } = req.body;

    // Age verification (18+)
    const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
    if (age < 18) {
      return res.status(403).json({ error: 'Must be 18 or older to register' });
    }

    let contactData = {};

    // If the client provided location data, use it.
    if (
      currentLocation &&
      currentLocation.latitude &&
      currentLocation.longitude
    ) {
      contactData = {
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(currentLocation.longitude),
            parseFloat(currentLocation.latitude)
          ]
        },
        city: currentLocation.city || 'Unknown',
        country: currentLocation.country || 'Unknown',
      };
      console.log('Using client-provided location:', contactData);
    } else {
      // Otherwise, fallback to geoip lookup.
      const ip = req.headers['x-forwarded-for'] || req.ip;
      console.log('Registering user from IP:', ip);

      const ipLocation = geoip.lookup(ip);
      console.log('GeoIP lookup result:', ipLocation);

      if (ipLocation && ipLocation.ll) {
        // geoip-lite returns [latitude, longitude]; flip them to [longitude, latitude]
        contactData = {
          location: {
            type: 'Point',
            coordinates: [ipLocation.ll[1], ipLocation.ll[0]]
          },
          city: ipLocation.city,
          country: ipLocation.country,
        };
      } else {
        console.warn('No valid location found for IP, using default location.');
        contactData = {
          location: {
            type: 'Point',
            coordinates: [0, 0] // Default value; change if desired.
          },
          city: 'Unknown',
          country: 'Unknown',
        };
      }
      console.log('Contact data set to:', contactData);
    }

    const user = new UserProfile({
      username,
      email,
      password,
      birthdate: new Date(birthdate),
      contact: contactData,
    });

    await user.save();
    console.log('User saved...');

    res.status(201).json({ message: 'User created!!!' });
  } catch (error) {
    createErrorResponse(res, 500, 'REGISTRATION_FAILED', 'Registration failed', error);
  }
});
// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user and include the password field explicitly
    const user = await UserProfile.findOne({ email }).select('+password');

    // Check if user exists and if password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return createErrorResponse(res, 401, 'LOGIN_FAILED', 'Invalid credentials');
    }

    // Sign JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    return createErrorResponse(res, 500, 'LOGIN_FAILED', 'Login failed', error);
  }
});

// Check if user exists
router.get('/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserProfile.findOne({ email });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error checking if user exists:', error);
    createErrorResponse(res, 500, 'USER_NOT_FOUND', 'User not found', error);
  }
});

// Get all profiles with optional filtering and sorting
router.get('/profiles', async (req, res) => {
  try {
    const { lat, lon, age, services } = req.query;
    const query = {};

    // ------ 1. Build Filter Query ------
    if (age) {
      const currentYear = new Date().getFullYear();
      const minBirthYear = currentYear - parseInt(age) - 1;
      const maxBirthYear = currentYear - parseInt(age);
      query.birthdate = {
        $gte: new Date(minBirthYear, 0, 1),
        $lt: new Date(maxBirthYear, 0, 1),
      };
    }

    if (services) {
      query.services = { $in: services.split(',') };
    }

    // ------ 2. Geolocation Pipeline ------
    let pipeline = [];

    if (lat && lon) {
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
          distanceField: 'distance',
          spherical: true,
          query: query,
        }
      });

      // ------ 3. Priority Sorting ------
      pipeline.push({
        $sort: {
          profileLevel: -1, // VIP (or higher level) first
          distance: 1 // Closest first within same level
        }
      });
    } else {
      pipeline.push({ $match: query });
      pipeline.push({
        $sort: {
          profileLevel: -1 // Sort by profile level if no location provided
        }
      });
    }

    // ------ 4. Pagination ------
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const profiles = await UserProfile.aggregate(pipeline);
    res.json(profiles);
  } catch (error) {
    console.error('Error getting profiles:', error);
    createErrorResponse(res, 500, 'GET_PROFILES_FAILED', 'Failed to get profiles', error);
  }
});
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await UserProfile.findById(req.userId);
    console.log('User found:', user);
    if (!user) {
      return createErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    res.json(user);
  } catch (error) {
    createErrorResponse(res, 500, 'GET_PROFILE_FAILED', 'Failed to get profile', error);
  }
});


export default router;
