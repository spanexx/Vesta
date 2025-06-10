import Admin from '../models/Admin.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export async function createMainAdmin() {
  try {
    console.log('Checking for main admin account...');
    
    // Check if default admin credentials are set
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com';
    const adminUsername = process.env.MAIN_ADMIN_USERNAME || 'mainadmin';
    const adminPassword = process.env.MAIN_ADMIN_PASSWORD || 'securePass123';
    
    console.log(`Looking for admin with email: ${adminEmail}`);
    
    // Check if admin exists - try both finding by email and username
    let existingAdmin = await Admin.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('Admin not found by email, checking by username...');
      existingAdmin = await Admin.findOne({ username: adminUsername });
    }    if (!existingAdmin) {
      console.log('No admin account found. Creating new admin account...');
      
      try {
        // Don't hash password here, let the mongoose model middleware handle it
        const mainAdmin = new Admin({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword, // The model's pre-save hook will hash this
          permissions: {
            canEditProfiles: true,
            canDeleteProfiles: true,
            canModerateContent: true,
            canManageSubscriptions: true,
            canCreateAdmin: true
          }
        });

        console.log('About to save admin...');
        const savedAdmin = await mainAdmin.save();
        console.log('Admin saved successfully:', savedAdmin._id);
        
        // Verify the admin was actually saved
        const verifyAdmin = await Admin.findById(savedAdmin._id);
        if (verifyAdmin) {
          console.log('✅ Admin verified in database');
        } else {
          console.log('❌ Admin not found after save');
        }
        
        console.log('✅ Main admin created successfully with credentials:');
        console.log(`   Username: ${adminUsername}`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        return savedAdmin;
      } catch (saveError) {
        console.error('❌ Error saving admin:', saveError);
        throw saveError;
      }
    } else {
      console.log('✅ Main admin already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      return existingAdmin;
    }
  } catch (error) {
    console.error('❌ Error creating main admin:', error);
    throw error;
  }
}
