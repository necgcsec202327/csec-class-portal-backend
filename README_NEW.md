# 🎓 Class Portal Backend API

Express.js backend API for the Class Portal application with MongoDB integration and JWT authentication.

## 🚀 Live Deployment

**Production API**: `https://csec-class-portal-backend.onrender.com`

## 📋 API Endpoints

### Public Endpoints
- `GET /` - API information and status
- `GET /api/health` - Health check with database status

### Data Endpoints  
- `GET /api/announcements` - Get all announcements [?limit=N]
- `GET /api/events` - Get all events
- `GET /api/resources` - Get resource tree
- `GET /api/timetable` - Get timetable data

### Admin Endpoints (Require JWT Authentication)
- `POST /api/auth/login` - Admin authentication `{"key": "password"}`
- `PUT /api/announcements` - Update announcements `{"items": [...]}`
- `PUT /api/events` - Update events `{"items": [...]}`
- `PUT /api/resources` - Update resource tree `{...tree}`
- `PUT /api/timetable` - Update timetable `{"url": "...", "type": "image|pdf"}`

## 🧪 Quick Test

```bash
# Health check
curl https://csec-class-portal-backend.onrender.com/api/health

# Get data
curl https://csec-class-portal-backend.onrender.com/api/announcements

# Admin login (use your ADMIN_KEY)
curl -X POST https://csec-class-portal-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"key":"admin123"}'
```

## ⚙️ Environment Variables (Required for Production)

```bash
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
ADMIN_KEY=your-secure-admin-password
JWT_SECRET=your-secure-jwt-secret  
ALLOWED_ORIGIN=https://cse-c.netlify.app
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev

# Optional: Seed with sample data
npm run seed
```

## 🚀 Render Deployment Guide

1. **Create Web Service** from `backend/` folder
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Add Environment Variables** (see above)
5. **Deploy** and note your URL

## 🔐 Authentication Flow

1. Admin calls `/api/auth/login` with admin key
2. Backend validates key against `ADMIN_KEY` 
3. Returns JWT token valid for 7 days
4. Admin includes `Authorization: Bearer <token>` in subsequent requests
