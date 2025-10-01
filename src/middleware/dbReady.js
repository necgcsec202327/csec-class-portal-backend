import mongoose from 'mongoose';

export function requireDb(req, res, next) {
  // 1 = connected, 2 = connecting, others are not ready
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  next();
}
