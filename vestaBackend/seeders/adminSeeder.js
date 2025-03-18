import Admin from '../models/Admin.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function createMainAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ email: process.env.MAIN_ADMIN_EMAIL });
    
    if (!existingAdmin) {
      const mainAdmin = new Admin({
        username: process.env.MAIN_ADMIN_USERNAME || 'mainadmin',
        email: process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com',
        password: process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123',
        permissions: {
          canEditProfiles: true,
          canDeleteProfiles: true,
          canModerateContent: true,
          canManageSubscriptions: true,
          canCreateAdmin: true
        }
      });

      await mainAdmin.save();
      console.log('Main admin created successfully');
      return mainAdmin;
    } else {
      console.log('Main admin already exists');
      return existingAdmin;
    }
  } catch (error) {
    console.error('Error creating main admin:', error);
    throw error;
  }
}
