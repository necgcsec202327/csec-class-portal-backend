# Backend (Render)

Express + Mongoose API for the Class Portal Website.

## Endpoints
- GET /api/announcements [?limit=N]
- PUT /api/announcements (admin)
- GET /api/events
- PUT /api/events (admin)
- GET /api/resources
- PUT /api/resources (admin)
- GET /api/timetable
- PUT /api/timetable (admin)
- POST /api/auth/login { key }

Auth: Bearer token from /api/auth/login (ADMIN_KEY required).

## Setup
1. Copy `.env.example` to `.env` and set:
   - MONGO_URI (MongoDB Atlas)
   - ADMIN_KEY (the admin key you’ll use to log in)
   - JWT_SECRET (random long string)
   - ALLOWED_ORIGIN (optional; set to your Netlify URL to lock down CORS)
2. Install deps and start:
   npm install
   npm run dev
3. Seed from frontend JSON (optional):
   npm run seed

## Deploying to Render
1) Create a Web Service from this `backend/` folder.
2) Build command: `npm install`
3) Start command: `npm start`
4) Add env vars: `MONGO_URI`, `ADMIN_KEY`, `JWT_SECRET`, and `ALLOWED_ORIGIN=https://<your-netlify-site>.netlify.app` (or custom domain).
5) Deploy and note the base URL (e.g. https://your-backend.onrender.com).