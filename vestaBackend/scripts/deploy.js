import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables
dotenv.config({ path: path.join(__dirname, '../.env.production') });

const validateMongoDBUri = (uri) => {
    if (!uri) return false;
    
    // Basic MongoDB URI format validation
    const mongoDbUrlPattern = /^mongodb(\+srv)?:\/\/.+:.+@[^:]+\.[^:]+\/[^:]+(\?.*)?$/;
    if (!mongoDbUrlPattern.test(uri)) {
        console.error('❌ Invalid MongoDB URI format');
        return false;
    }
    
    // Check for required components
    try {
        const url = new URL(uri);
        if (!url.username || !url.password) {
            console.error('❌ MongoDB URI missing credentials');
            return false;
        }
        if (!url.pathname.slice(1)) {
            console.error('❌ MongoDB URI missing database name');
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Invalid MongoDB URI:', error.message);
        return false;
    }
};

const preDeploymentChecks = async () => {
    const checks = {
        mongodb: false,
        requiredEnvVars: false,
        uploadsDirectory: false,
        productionDomain: false
    };
    
    console.log('Running pre-deployment checks...');

    // Check production domain configuration
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && !frontendUrl.includes('localhost')) {
        console.log('✅ Production domain configured:', frontendUrl);
        checks.productionDomain = true;
    } else {
        console.error('❌ Invalid production domain. FRONTEND_URL should be a production URL, not localhost');
    }

    // Validate MongoDB URI
    const mongoUri = process.env.MONGODB_URI;
    if (validateMongoDBUri(mongoUri)) {
        console.log('✅ MongoDB URI format is valid');
        
        // Test MongoDB connection
        try {
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 10000, // 10 second timeout
                heartbeatFrequencyMS: 30000     // 30 second heartbeat
            });
            await mongoose.connection.db.admin().ping();
            console.log('✅ MongoDB connection successful');
            checks.mongodb = true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
        } finally {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
            }
        }
    }

    // Check required environment variables
    const requiredVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'FRONTEND_URL',
        'CORS_ORIGINS'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length === 0) {
        console.log('✅ All required environment variables are set');
        checks.requiredEnvVars = true;
    } else {
        console.error('❌ Missing required environment variables:', missingVars.join(', '));
    }

    // Check uploads directory
    const uploadsPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsPath)) {
        try {
            fs.mkdirSync(uploadsPath, { recursive: true });
            console.log('✅ Uploads directory created successfully');
            checks.uploadsDirectory = true;
        } catch (error) {
            console.error('❌ Failed to create uploads directory:', error.message);
        }
    } else {
        console.log('✅ Uploads directory exists');
        checks.uploadsDirectory = true;
    }

    // Final check results
    const allChecksPass = Object.values(checks).every(check => check === true);
    if (allChecksPass) {
        console.log('\n✅ All pre-deployment checks passed. Ready for deployment!');
        return true;
    } else {
        console.error('\n❌ Some pre-deployment checks failed. Please fix the issues before deploying.');
        return false;
    }
};

// Run the checks
preDeploymentChecks().then(passed => {
    if (!passed) {
        process.exit(1);
    }
});