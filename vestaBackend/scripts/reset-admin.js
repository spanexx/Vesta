import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin by email
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com';
    let admin = await Admin.findOne({ email: adminEmail });

    if (admin) {
      // Reset password
      const password = process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      admin.password = hashedPassword;
      await admin.save();
      
      console.log(`Password reset successfully for admin: ${admin.email}`);
    } else {
      // Create new admin if it doesn't exist
      const newAdmin = new Admin({
        username: process.env.MAIN_ADMIN_USERNAME || 'mainadmin',
        email: adminEmail,
        password: process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123',
        permissions: {
          canEditProfiles: true,
          canDeleteProfiles: true,
          canModerateContent: true,
          canManageSubscriptions: true,
          canCreateAdmin: true
        }
      });

      await newAdmin.save();
      console.log(`Created new admin: ${newAdmin.email}`);
    }

    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123'}`);
    console.log('Please use these credentials to log in');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

resetAdminPassword();
