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
app.use(cors({ origin: ALLOWED_ORIGIN ? [ALLOWED_ORIGIN] : true, credentials: false }));
app.use(express.json({ limit: '2mb' }));

const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 4000;

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/timetable', timetableRouter);

async function start(){
  if (!MONGO_URI) {
    console.warn('MONGO_URI not set. API will start but DB operations will fail.');
  } else {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  }
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

start();
