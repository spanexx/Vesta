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
    let admin = await Admin.findOne({ email: adminEmail }); 
 
    if (admin) { 
      // Reset password 
      const hashedPassword = await bcrypt.hash(password, 12); 
ECHO is off.
      admin.password = hashedPassword; 
      await admin.save(); 
ECHO is off.
      console.log(`Password reset successfully for admin: ${admin.email}`); 
    } else { 
      // Create new admin if it doesn't exist 
      const newAdmin = new Admin({ 
        email: adminEmail, 
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
