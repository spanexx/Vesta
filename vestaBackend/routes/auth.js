import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import createErrorResponse from '../utils/errorHandler.js';
import Profile from '../models/Profile.js';
import { calculateDistance } from '../utils/geolocation.js';

// User registration with age verification
const router = express.Router();
router.post('/register', async (req, res) => {
  try {
    const { email, password, birthdate } = req.body;
    
    // Age verification (18+)
    const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
    if (age < 18) {
      return res.status(403).json({ error: 'Must be 18 or older to register' });
    }
    
    console.log('Registering user...');
    const user = new User({
      email,
      password,
      birthdate: new Date(birthdate)
    });
    
    await user.save();
    console.log('User saved...');
    
    // Create a profile for the new user
    const profileData = {}; // Add any default profile data here if needed
    await Profile.createProfile(user._id, birthdate, profileData);
    console.log('Profile created...');
    
    res.status(201).json({ message: 'User created and profile initialized' });
  } catch (error) {
    console.error('Error registering user:', error);
    createErrorResponse(res, 500, 'REGISTRATION_FAILED', 'Registration failed', error);
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password').catch((error) => createErrorResponse(res, 500, 'USER_NOT_FOUND', 'User not found'));
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      createErrorResponse(res, 401, 'LOGIN_FAILED', 'Invalid credentials')
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    createErrorResponse(res, 500, 'LOGIN_FAILED', 'Login failed')
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

// Get all profiles
router.get('/profiles', async (req, res) => {
  try {
    const query = {};
    if (req.query.location) {
      query['contact.location'] = req.query.location;
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
        } else if (a.level !== 'vip' && b.level === 'vip') {
          return 1;
        } else {
          // Calculate distance between two points
          console.log(req.query.viewerLocation)
          const distanceA = calculateDistance(a.contact.location.coordinates, req.query.viewerLocation);
          const distanceB = calculateDistance(b.contact.location.coordinates, req.query.viewerLocation);
          return distanceA - distanceB;
        }
      });
    }
    res.json(profiles);
  } catch (error) {
    console.error('Error getting profiles:', error);
    createErrorResponse(res, 500, 'GET_PROFILES_FAILED', 'Failed to get profiles', error);
  }
});

export default router;