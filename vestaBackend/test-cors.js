// Test CORS configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('CORS_ORIGINS:', process.env.CORS_ORIGINS);
console.log('CORS_ORIGINS parsed:', process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : []);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
