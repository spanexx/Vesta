import mongoose from 'mongoose';
import { config } from '../config/config.js';

const validateStartup = async () => {
    // Validate MongoDB indices
    try {
        await mongoose.connect(config.mongoUri);
        const collections = await mongoose.connection.db.collections();
        
        for (const collection of collections) {
            const indices = await collection.indexes();
            console.log(`✓ ${collection.collectionName} indices:`, indices.length);
        }
    } catch (error) {
        console.error('MongoDB validation failed:', error);
        process.exit(1);
    }

    // Validate required directories
    try {
        const { default: fs } = await import('fs');
        const { default: path } = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const uploadsDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            console.error('Uploads directory missing');
            process.exit(1);
        }
        console.log('✓ Uploads directory exists');
    } catch (error) {
        console.error('Directory validation failed:', error);
        process.exit(1);
    }

    console.log('✓ All validations passed');
    process.exit(0);
}

validateStartup();