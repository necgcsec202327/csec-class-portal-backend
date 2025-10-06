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
  console.log('🌳 Resources PUT request body:', JSON.stringify(req.body, null, 2));
  
  const root = req.body;
  if (!root || root.type !== 'folder') {
    console.log('❌ Resources validation failed:', { 
      hasRoot: !!root, 
      type: root?.type,
      expectedType: 'folder' 
    });
    return res.status(400).json({ error: 'root folder required' });
  }
  
  try {
    await ResourceTree.deleteMany({});
    const saved = await ResourceTree.create({ root });
    console.log('✅ Resources saved successfully:', saved._id);
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Resources save failed:', error);
    res.status(500).json({ error: 'Failed to save resources', details: error.message });
  }
});
