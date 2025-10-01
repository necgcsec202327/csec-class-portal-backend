import { Router } from 'express';
import Timetable from '../models/Timetable.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

export const router = Router();

router.get('/', requireDb, async (req,res) => {
  const doc = await Timetable.findOne().lean();
  res.json(doc || { url:'', type:'image' });
});

router.put('/', requireDb, requireAuth, async (req,res) => {
  const { url, type } = req.body || {};
  if (typeof url !== 'string') return res.status(400).json({ error: 'url required' });
  await Timetable.deleteMany({});
  await Timetable.create({ url, type: (type==='pdf')? 'pdf' : 'image' });
  res.json({ ok: true });
});
