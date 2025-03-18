import express from 'express';
import Admin from '../models/Admin.js';
import UserProfile from '../models/UserProfile.js';
import { adminAuth } from '../middleware/adminAuth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await admin.validatePassword(password))) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'LOGIN_FAILED',
      message: error.message
    });
  }
});

// Get all profiles (admin access)
router.get('/profiles', adminAuth, async (req, res) => {
  try {
    const profiles = await UserProfile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: error.message
    });
  }
});

// Update any profile (admin access)
router.patch('/profiles/:id', adminAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({
      error: 'UPDATE_FAILED',
      message: error.message
    });
  }
});

// Delete profile (admin access)
router.delete('/profiles/:id', adminAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findByIdAndDelete(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'DELETE_FAILED',
      message: error.message
    });
  }
});

export default router;
