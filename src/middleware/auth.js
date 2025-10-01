import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ')? hdr.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
