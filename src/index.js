import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { router as authRouter } from './routes/auth.js';
import { router as announcementsRouter } from './routes/announcements.js';
import { router as eventsRouter } from './routes/events.js';
import { router as resourcesRouter } from './routes/resources.js';
import { router as timetableRouter } from './routes/timetable.js';

dotenv.config();

const app = express();
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 4000;

// Enhanced CORS configuration
console.log('CORS ALLOWED_ORIGIN:', ALLOWED_ORIGIN);
app.use(cors({ 
  origin: ALLOWED_ORIGIN ? [ALLOWED_ORIGIN] : true, 
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Root route for basic info
app.get('/', (req, res) => {
  res.json({
    name: 'Class Portal Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      announcements: '/api/announcements',
      events: '/api/events',
      resources: '/api/resources',
      timetable: '/api/timetable'
    },
    database: MONGO_URI ? 'connected' : 'not configured'
  });
});

// API routes
app.get('/api/health', (req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/timetable', timetableRouter);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

async function start(){
  console.log('🚀 Starting Class Portal Backend...');
  console.log('📊 Environment:', {
    PORT,
    MONGO_URI: MONGO_URI ? '✅ Configured' : '❌ Missing',
    ADMIN_KEY: process.env.ADMIN_KEY ? '✅ Configured' : '❌ Missing',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing',
    ALLOWED_ORIGIN: ALLOWED_ORIGIN || '❌ Missing'
  });

  if (!MONGO_URI) {
    console.warn('⚠️  MONGO_URI not set. API will start but DB operations will fail.');
  } else {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
    }
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Class Portal API listening on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  });
}

start();
