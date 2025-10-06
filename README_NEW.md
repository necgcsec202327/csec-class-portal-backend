# 🚀 Class Portal Backend API

## Overview
Node.js + Express backend for the Class Portal with MongoDB Atlas integration, JWT authentication, and comprehensive API endpoints.

## 🌐 Production Deployment
- **Live API**: https://csec-class-portal-backend.onrender.com
- **Health Check**: https://csec-class-portal-backend.onrender.com/api/health
- **API Documentation**: https://csec-class-portal-backend.onrender.com/

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login with key

### Data Endpoints (GET - Public, PUT - Admin only)
- `GET/PUT /api/announcements` [?limit=N] - Class announcements
- `GET/PUT /api/events` - Calendar events
- `GET/PUT /api/resources` - Resource tree structure
- `GET/PUT /api/timetable` - Class timetable

### System
- `GET /api/health` - Health check and status
- `GET /` - API information and environment status

## 🔐 Environment Variables (Required for Production)

```bash
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
ADMIN_KEY=your-secure-admin-password
JWT_SECRET=your-super-secure-jwt-secret-key
ALLOWED_ORIGIN=https://your-frontend-domain.netlify.app
```

## 🧪 Testing API Endpoints

### Health Check
```bash
curl https://csec-class-portal-backend.onrender.com/api/health
```

### Authentication
```bash
curl -X POST https://csec-class-portal-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"key":"admin123"}'
```

### Get Data
```bash
curl https://csec-class-portal-backend.onrender.com/api/announcements
```

## 🔧 Development Setup

1. **Environment Variables**: Copy `.env.example` to `.env` and configure:
   ```bash
   MONGO_URI=mongodb+srv://...
   ADMIN_KEY=admin123
   JWT_SECRET=your-random-secret
   ALLOWED_ORIGIN=https://cse-c.netlify.app
   ```

2. **Install & Run**:
   ```bash
   npm install
   npm run dev  # Development with auto-restart
   npm start    # Production
   ```

3. **Optional Seeding**:
   ```bash
   npm run seed
   ```

## 🚀 Render Deployment

1. **Create Web Service** from `backend/` folder
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `ADMIN_KEY`: Admin password for frontend login
   - `JWT_SECRET`: Random secure string for JWT signing
   - `ALLOWED_ORIGIN`: `https://cse-c.netlify.app` (no trailing slash)

## 🐛 Enhanced Debugging Features

The backend now includes:
- 📝 **Request Logging**: All requests logged with timestamp, method, path, origin
- 🌐 **CORS Debugging**: Detailed CORS validation and logging
- 🔍 **Health Monitoring**: Database status, uptime, environment validation
- ⚙️ **Environment Validation**: Startup checks for required variables
- 🚨 **Error Handling**: Global error handler with detailed logging
- 📋 **API Documentation**: Live endpoint documentation at root URL

## 🔗 Frontend Integration

The enhanced backend provides:
- **Real-time Status**: Visit root URL for live API status
- **Health Monitoring**: `/api/health` shows database and system status
- **CORS Debugging**: Detailed logging of cross-origin requests
- **Error Transparency**: Clear error messages for debugging

## 🔒 Security & Monitoring

- JWT-based admin authentication
- Origin-based CORS protection
- Request logging and monitoring
- Environment variable validation
- Graceful error handling
- Database connection monitoring
