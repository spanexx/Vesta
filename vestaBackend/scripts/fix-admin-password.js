// Reset admin password script
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB directly without using the model
// This allows us to update the password hash directly without triggering middleware
async function resetAdminPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta2.com';
    const adminPassword = process.env.MAIN_ADMIN_PASSWORD || 'securePass1234';
    
    console.log(`Attempting to reset password for admin: ${adminEmail}`);
    
    // Hash the password directly
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Update admin password directly in the database
    const result = await mongoose.connection.collection('admins').updateOne(
      { email: adminEmail },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount === 0) {
      console.log(`Admin with email ${adminEmail} not found`);
    } else if (result.modifiedCount === 0) {
      console.log('Password was already set to this value');
    } else {
      console.log('Password reset successfully');
    }
    
    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error resetting admin password:', error);
  }
}

// Run the function
resetAdminPassword();
