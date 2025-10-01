import { Router } from 'express';
import Event from '../models/Event.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

export const router = Router();

router.get('/', requireDb, async (req, res) => {
  const items = await Event.find().lean();
  res.json(items);
});

router.put('/', requireDb, requireAuth, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  await Event.deleteMany({});
  await Event.insertMany(items);
  res.json({ ok: true });
});
