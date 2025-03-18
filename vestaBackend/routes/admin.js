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

// Create new admin (requires admin with canCreateAdmin permission)
router.post('/create', adminAuth, async (req, res) => {
  try {
    // Check if current admin has permission to create other admins
    if (!req.admin.permissions.canCreateAdmin) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to create new admins'
      });
    }

    const { username, email, password, permissions } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({
        error: 'ADMIN_EXISTS',
        message: 'An admin with this email or username already exists'
      });
    }

    // Create new admin with default permissions (can't create other admins)
    const newAdmin = new Admin({
      username,
      email,
      password,
      permissions: {
        ...permissions,
        canCreateAdmin: false // Ensure new admins can't create other admins by default
      }
    });

    await newAdmin.save();

    // Remove password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      message: 'Admin created successfully',
      admin: adminResponse
    });
  } catch (error) {
    res.status(500).json({
      error: 'CREATE_FAILED',
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
    console.log('Error fetching profiles:', error);

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

// Get all profiles with their files (admin access)
router.get('/users/files', adminAuth, async (req, res) => {
  try {
    // Check if admin has permission to moderate content
    if (!req.admin.permissions.canModerateContent) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to view user files'
      });
    }

    const profiles = await UserProfile.find({}, {
      username: 1,
      email: 1,
      images: 1,
      videos: 1,
      verificationDocuments: 1,
      profilePicture: 1
    });

    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: error.message
    });
  }
});

// Update user profile by ID (admin access)
router.patch('/users/:id/edit', adminAuth, async (req, res) => {
  try {
    // Check if admin has permission to edit profiles
    if (!req.admin.permissions.canEditProfiles) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to edit user profiles'
      });
    }

    const allowedFields = [
      'status',
      'verificationStatus',
      'moderationFlags',
      'profileLevel',
      'role'
    ];

    // Filter out non-allowed fields
    const updateData = Object.keys(req.body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const profile = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    res.status(500).json({
      error: 'UPDATE_FAILED',
      message: error.message
    });
  }
});

// Delete user file (admin access)
router.delete('/users/:userId/files/:fileType/:fileId', adminAuth, async (req, res) => {
  try {
    // Check if admin has permission to moderate content
    if (!req.admin.permissions.canModerateContent) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to delete user files'
      });
    }

    const { userId, fileType, fileId } = req.params;
    const profile = await UserProfile.findById(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    let updateField;
    switch (fileType) {
      case 'images':
        updateField = 'images';
        break;
      case 'videos':
        updateField = 'videos';
        break;
      case 'documents':
        updateField = 'verificationDocuments';
        break;
      default:
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Invalid file type specified'
        });
    }

    // Remove file from array
    await UserProfile.findByIdAndUpdate(userId, {
      $pull: { [updateField]: fileId }
    });

    res.json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'DELETE_FAILED',
      message: error.message
    });
  }
});

export default router;
