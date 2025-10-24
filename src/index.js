import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import { router as authRouter } from './routes/auth.js';
import { router as announcementsRouter } from './routes/announcements.js';
import { router as eventsRouter } from './routes/events.js';
import { router as resourcesRouter } from './routes/resources.js';
import { router as timetableRouter } from './routes/timetable.js';
import { router as bannersRouter } from './routes/banners.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 4000;
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin || 'undefined'}`);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // If ALLOWED_ORIGIN is set, check against it
    if (ALLOWED_ORIGIN) {
      const allowedOrigins = ALLOWED_ORIGIN.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Origin ${origin} allowed`);
        return callback(null, true);
      } else {
        console.log(`❌ CORS: Origin ${origin} not in allowed list: ${allowedOrigins.join(', ')}`);
        return callback(new Error('Not allowed by CORS'));
      }
    }
    
    // If no ALLOWED_ORIGIN set, allow all
    console.log(`⚠️  CORS: No ALLOWED_ORIGIN set, allowing all origins`);
    callback(null, true);
  },
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from uploads directories
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/timetables', express.static(path.join(__dirname, '../uploads/timetables')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 ${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// Root route with API information
app.get('/', (req, res) => {
  res.json({
    name: 'Class Portal Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      announcements: '/api/announcements',
      events: '/api/events',
      resources: '/api/resources',
      timetable: '/api/timetable',
      banners: '/api/banners'
    },
    environment: {
      port: PORT,
      mongoConnected: mongoose.connection.readyState === 1,
      allowedOrigin: ALLOWED_ORIGIN || 'all origins',
      adminKeySet: !!ADMIN_KEY,
      jwtSecretSet: !!JWT_SECRET
    }
  });
});

// Enhanced health check
app.get('/api/health', (req, res) => {
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
    },
    config: {
      mongoUri: !!MONGO_URI,
      adminKey: !!ADMIN_KEY,
      jwtSecret: !!JWT_SECRET,
      allowedOrigin: ALLOWED_ORIGIN || 'not set'
    }
  };
  
  console.log('🏥 Health check requested:', health);
  res.json(health);
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/banners', bannersRouter);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404: Unknown API route ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: ['/api/health', '/api/auth/login', '/api/announcements', '/api/events', '/api/resources', '/api/timetable', '/api/banners']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

async function start() {
  console.log('🚀 Starting Class Portal Backend...');
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔒 ALLOWED_ORIGIN: ${ALLOWED_ORIGIN || 'not set (allowing all)'}`);
  console.log(`🔑 ADMIN_KEY: ${ADMIN_KEY ? '✅ set' : '❌ not set'}`);
  console.log(`🔐 JWT_SECRET: ${JWT_SECRET ? '✅ set' : '❌ not set'}`);
  console.log(`🗄️  MONGO_URI: ${MONGO_URI ? '✅ set' : '❌ not set'}`);

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
    console.log(`🎉 Class Portal Backend API listening on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API info: http://localhost:${PORT}/`);
    console.log('🔄 Ready to handle requests!');
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();
