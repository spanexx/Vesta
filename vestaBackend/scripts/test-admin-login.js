import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script directly tests login credentials against MongoDB
 * without going through the API. It helps debug authentication issues.
 */
async function testLogin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Admin model
    const Admin = mongoose.model('Admin', new mongoose.Schema({
      username: String,
      email: String,
      password: { type: String, select: false }
    }));

    // Test credentials
    const email = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta2.com';
    const password = process.env.MAIN_ADMIN_PASSWORD || 'securePass1234';
    
    console.log(`Testing login for admin: ${email}`);
    
    // Find admin with password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.error(`❌ No admin found with email: ${email}`);
      return;
    }
    
    console.log('Admin found in database:');
    console.log(`- Username: ${admin.username}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Password hash: ${admin.password}`);
    
    // Test password directly with bcrypt
    console.log(`\nTesting password: ${password}`);
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is VALID!');
    } else {
      console.error('❌ Password is INVALID!');
      
      // Additional debugging - check password hash
      console.log('\nHashing the test password with bcrypt for comparison:');
      const newHash = await bcrypt.hash(password, 12);
      console.log(`Original hash: ${admin.password}`);
      console.log(`New hash:      ${newHash}`);
      
      // Fix password directly
      console.log('\nAttempting to fix password...');
      admin.password = await bcrypt.hash(password, 12);
      await admin.save();
      console.log('Password updated in database');
      
      // Verify the fix
      const updatedAdmin = await Admin.findOne({ email }).select('+password');
      const isFixedPasswordValid = await bcrypt.compare(password, updatedAdmin.password);
      console.log(`Password valid after fix: ${isFixedPasswordValid ? 'YES ✅' : 'NO ❌'}`);
    }
    
  } catch (error) {
    console.error('Error during login test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testLogin();
