import { Router } from 'express';
import Announcement from '../models/Announcement.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

export const router = Router();

router.get('/', requireDb, async (req, res) => {
  const { limit } = req.query;
  const items = await Announcement.find().sort({ createdAt: -1 }).limit(parseInt(limit||'0')||0).lean();
  res.json(items);
});

router.put('/', requireDb, requireAuth, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  // Simplistic replace: drop and insert
  await Announcement.deleteMany({});
  await Announcement.insertMany(items.map(i => ({ ...i, createdAt: i.createdAt ? new Date(i.createdAt) : new Date() })));
  res.json({ ok: true });
});
