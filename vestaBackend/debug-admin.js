import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check if admin collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Try to find all admins
    const admins = await Admin.find({});
    console.log('Found admins:', admins.length);
    console.log('Admins:', admins);
    
    // Check the exact admin we're looking for
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com';
    const adminUsername = process.env.MAIN_ADMIN_USERNAME || 'mainadmin';
    
    console.log('Looking for admin with email:', adminEmail);
    console.log('Looking for admin with username:', adminUsername);
    
    const adminByEmail = await Admin.findOne({ email: adminEmail });
    const adminByUsername = await Admin.findOne({ username: adminUsername });
    
    console.log('Admin by email:', adminByEmail);
    console.log('Admin by username:', adminByUsername);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
