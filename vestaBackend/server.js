import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import moderationRoutes from './routes/moderation.js';
import uploadRoutes from './routes/upload.js';  // Changed from uploadRoutes.js to upload.js
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Configure body parser with increased payload limit
app.use(express.json({
  limit: '50mb',
  type: 'application/json'
}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 10000
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/profiles', uploadRoutes);

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