import { Router } from 'express';
import ResourceTree from '../models/ResourceTree.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

export const router = Router();

router.get('/', requireDb, async (req, res) => {
  const doc = await ResourceTree.findOne().lean();
  if (!doc) return res.json({ name:'Resources', type:'folder', children: [] });
  res.json(doc.root);
});

router.put('/', requireDb, requireAuth, async (req, res) => {
  const root = req.body;
  if (!root || root.type !== 'folder') return res.status(400).json({ error: 'root folder required' });
  await ResourceTree.deleteMany({});
  await ResourceTree.create({ root });
  res.json({ ok: true });
});
