import { Router } from 'express';
import jwt from 'jsonwebtoken';

export const router = Router();

router.post('/login', (req, res) => {
  const { key } = req.body || {};
  const adminKey = process.env.ADMIN_KEY || 'change-me';
  if (!key || key !== adminKey) return res.status(401).json({ error: 'Invalid key' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token });
});
