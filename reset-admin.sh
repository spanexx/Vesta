#!/bin/bash

# This script resets the admin password or creates a new admin account if one doesn't exist
# To run this on Render:
# 1. SSH into your Render service using the web terminal
# 2. Create this file using nano or another editor
# 3. Make it executable with: chmod +x reset-admin.sh
# 4. Run it: ./reset-admin.sh

echo "Resetting admin account..."

# Create a temporary reset script
cat > reset-admin.js << 'EOL'
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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

resetAdminPassword();
EOL

# Run the script
node reset-admin.js

# Clean up
rm reset-admin.js

echo "Admin reset process completed."
