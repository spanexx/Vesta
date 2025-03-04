import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import createErrorResponse from '../utils/errorHandler.js';

const router = express.Router();

// User registration with age verification
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, birthdate } = req.body;

    // Age verification (18+)
    const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
    if (age < 18) {
      return res.status(403).json({ error: 'Must be 18 or older to register' });
    }

    console.log('Registering user...');
    const user = new User({
      username,
      email,
      password,
      birthdate: new Date(birthdate),
    });

    await user.save();
    console.log('User saved...');

    // Create a profile for the new user
    const profileData = {}; // Add any default profile data here if needed
    await Profile.createProfile(user._id, birthdate, profileData);
    console.log('Profile created...');

    res.status(201).json({ message: 'User created and profile initialized' });
  } catch (error) {
    createErrorResponse(res, 500, 'REGISTRATION_FAILED', 'Registration failed', error);
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user and include the password field explicitly
    const user = await User.findOne({ email }).select('+password');

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
    const user = await User.findOne({ email });
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
          query: query, // Applies filters
          // Remove maxDistance to include all profiles
        }
      });

      // ------ 3. Priority Sorting ------
      pipeline.push({
        $sort: {
          level: -1, // VIP first
          distance: 1 // Closest first within same level
        }
      });
    } else {
      pipeline.push({ $match: query });
      pipeline.push({
        $sort: {
          level: -1 // Sort by level if no location
        }
      });
    }

    // ------ 4. Pagination ------
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const profiles = await Profile.aggregate(pipeline);
    res.json(profiles);
  } catch (error) {
    console.error('Error getting profiles:', error);
    createErrorResponse(res, 500, 'GET_PROFILES_FAILED', 'Failed to get profiles', error);
  }
});
export default router;