import Admin from '../models/Admin.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin credentials from .env
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta2.com';
    const adminPassword = process.env.MAIN_ADMIN_PASSWORD || 'securePass1234';
    
    console.log(`Looking for admin account with email: ${adminEmail}`);
    
    // Find the admin by email
    let admin = await Admin.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log(`Admin account with email ${adminEmail} not found, attempting to create it...`);
      
      // Create new admin
      admin = new Admin({
        username: process.env.MAIN_ADMIN_USERNAME || 'mainadmin2',
        email: adminEmail,
        permissions: {
          canEditProfiles: true,
          canDeleteProfiles: true,
          canModerateContent: true,
          canManageSubscriptions: true,
          canCreateAdmin: true
        }
      });
    }
    
    console.log(`Setting password for admin: ${admin.username} (${admin.email})`);
    
    // Reset password - directly set the hashed password to avoid double hashing
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Set password and save
    admin.password = hashedPassword;
    admin.markModified('password'); // Mark as modified to ensure it saves
    
    // Save with the setOptions to bypass schema validation if needed
    await admin.save({ validateBeforeSave: false });
    
    console.log('✅ Admin account updated successfully!');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    
    // Test if login works with new password
    const updatedAdmin = await Admin.findOne({ email: adminEmail }).select('+password');
    
    if (!updatedAdmin) {
      console.error('❌ Could not find admin after update!');
      process.exit(1);
    }
    
    console.log('Running password validation test...');
    const passwordMatches = await bcrypt.compare(adminPassword, updatedAdmin.password);
    
    if (passwordMatches) {
      console.log('✅ Password validation test successful!');
    } else {
      console.error('❌ Password validation test failed!');
      console.log('Stored hash:', updatedAdmin.password);
      
      // Try direct update as fallback
      console.log('Attempting direct update as fallback...');
      await Admin.updateOne(
        { _id: updatedAdmin._id },
        { $set: { password: hashedPassword } }
      );
      console.log('Direct update completed, please test login again.');
    }
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetAdminPassword();

resetAdminPassword();
