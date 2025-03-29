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
import { createMainAdmin } from './seeders/adminSeeder.js';
import { securityHeaders } from './middleware/securityHeaders.js';

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

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // We're handling CSP in securityHeaders middleware
}));

// Update CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:4200',
  ],
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

// Add security headers middleware before routes
app.use(securityHeaders);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await createMainAdmin();
    } catch (error) {
      console.error('Error creating main admin:', error);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoUploadRoutes);
app.use('/media', mediaRouter);  // Changed from /api/media to /media

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