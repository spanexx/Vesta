import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createMainAdmin } from '../seeders/adminSeeder.js';

// Load environment variables
dotenv.config();

async function ensureAdminExists() {
  console.log('Starting admin verification process...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Create admin if it doesn't exist
    await createMainAdmin();
    
    console.log('Admin verification completed successfully');
  } catch (error) {
    console.error('Error during admin verification:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
ensureAdminExists();
