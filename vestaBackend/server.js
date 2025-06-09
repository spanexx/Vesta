import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import moderationRoutes from './routes/moderation.js';
// import uploadRoutes from './routes/upload.js';  // Changed from uploadRoutes.js to upload.js
import paymentRoutes from './routes/payments.js';  // Add this import
import videoUploadRoutes from './routes/videoUpload.js'; // Add this import
import mediaRouter from './routes/media.js';
import adminRoutes from './routes/admin.js';
import identityVerificationRoutes from './routes/identityVerification.js';
import performanceRoutes from './routes/performance.js';
import { createMainAdmin } from './seeders/adminSeeder.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { monitorRequest, initializePerformanceMetrics } from './utils/monitoring.js';

import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

dotenv.config();

const app = express();

// Trust proxy - needed for X-Forwarded-For headers in production environments like Render
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // We're handling CSP in securityHeaders middleware
}));

// Update CORS configuration
const corsOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
  ['http://localhost:4200', 'https://vesta.spanexx.com', "https://vestagirls.online"];

console.log('Allowed CORS origins:', corsOrigins);

// CORS configuration - must be before any routes
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS policy:`, origin);
      callback(null, true); // Allow all origins for now to debug
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  credentials: true,
  maxAge: 600
}));

// Increase payload limit and timeout
app.use(express.json({
  limit: '100mb',
  type: 'application/json',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  limit: '100mb',
  extended: true,
  parameterLimit: 50000
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Move static file serving before routes and update CORS headers
app.use('/files', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'credentialless');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Max-Age', '86400');
  next();
});

app.use('/files', express.static(path.join(__dirname, 'uploads')));

// Add error handling for file serving
app.use('/files', (err, req, res, next) => {
  console.error('File serving error:', err);
  res.status(404).json({
    success: false,
    message: 'File not found'
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
  }
  next();
});

// Add monitoring middleware before routes
app.use(monitorRequest);

// Add security headers middleware before routes
app.use(securityHeaders);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log('Initializing admin account...');
    try {
      // Create main admin account if it doesn't exist
      await createMainAdmin();
      console.log('Admin initialization completed');
      
      // Initialize performance metrics service
      console.log('Initializing performance monitoring...');
      const performanceService = initializePerformanceMetrics();
      if (performanceService) {
        console.log('✅ Performance monitoring initialized');
        
        // Establish baseline after a delay to let the system settle
        setTimeout(() => {
          console.log('🔍 Starting baseline measurement...');
          performanceService.establishBaseline();
        }, 10000); // Wait 10 seconds after startup
      }
    } catch (error) {
      console.error('❌ Error during admin initialization:', error);
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Vesta API Server',
    NOTE: 'This is a placeholder API server for Vesta - Professional Adult Dating Platform(EDUCATIONAL PURPOSES ONLY)',
    version: '1.0.0',
    status: 'Running',
    description: 'Backend API for Vesta - Professional Adult Dating Platform',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      public: [
        'GET / - API information (this endpoint)',
        'GET /api/test-cors - CORS testing endpoint',
        'GET /api/profiles/profiles'
      ],
      authentication: [
        'POST /api/auth/register - User registration',
        'POST /api/auth/login - User login',
        'POST /api/auth/forgot-password - Password reset request',
        'POST /api/auth/reset-password - Password reset confirmation'
      ],
      protected: [
        'GET /api/profiles - User profiles (with authentication)',
        'POST /api/payments - Payment processing',
        'POST /api/videos - Video upload',
        'POST /api/media - Media upload',
        'POST /api/identity - Identity verification',
        'GET /api/admin - Admin dashboard (admin only)',
        'GET /api/performance - Performance metrics (admin only)'
      ]
    },
    documentation: {
      frontend: 'https://vestagirls.online',
      github: 'https://github.com/spanexx/Vesta',
      admin: 'https://spanexx.com',
      support: 'Contact admin for API documentation'
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoUploadRoutes);
app.use('/api/media', mediaRouter);  // Changed from /media to /api/media for consistency
app.use('/api/identity', identityVerificationRoutes);  // Add identity verification routes
app.use('/api/performance', performanceRoutes);  // Add performance monitoring routes

// Test route for CORS
app.get('/api/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin || 'No origin header',
    time: new Date().toISOString()
  });
});

// Content moderation middleware
app.use((req, res, next) => {
  // Placeholder for content scanning logic
  const suspiciousContent = true; // Replace with actual content scanning logic
  if (suspiciousContent) {
    io.emit('suspicious-activity', 'Suspicious activity detected');
  }
  next();
});

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});