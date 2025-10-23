import { Router } from 'express';
import Banner from '../models/Banner.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

export const router = Router();

// GET all banners (public - for displaying on frontend)
router.get('/', requireDb, async (req, res) => {
  try {
    const { active } = req.query;
    const now = new Date();
    
    let query = {};
    
    // If active=true, only return active banners within date range
    if (active === 'true') {
      query = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      };
    }
    
    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// GET single banner by ID
router.get('/:id', requireDb, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).lean();
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ error: 'Failed to fetch banner' });
  }
});

// POST create new banner (admin only)
router.post('/', requireDb, requireAuth, async (req, res) => {
  try {
    const { type, message, link, linkText, startDate, endDate, priority, isActive } = req.body;
    
    // Validation
    if (!message || !endDate) {
      return res.status(400).json({ error: 'Message and end date are required' });
    }
    
    if (!['urgent', 'important', 'info', 'success'].includes(type)) {
      return res.status(400).json({ error: 'Invalid banner type' });
    }
    
    const banner = new Banner({
      type,
      message,
      link: link || '',
      linkText: linkText || 'Learn More',
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      priority: priority !== undefined ? priority : 0,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await banner.save();
    console.log('✅ Banner created:', banner._id);
    res.status(201).json(banner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

// PUT update existing banner (admin only)
router.put('/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const { type, message, link, linkText, startDate, endDate, priority, isActive } = req.body;
    
    // Validation
    if (type && !['urgent', 'important', 'info', 'success'].includes(type)) {
      return res.status(400).json({ error: 'Invalid banner type' });
    }
    
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (message !== undefined) updateData.message = message;
    if (link !== undefined) updateData.link = link;
    if (linkText !== undefined) updateData.linkText = linkText;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();
    
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    console.log('✅ Banner updated:', banner._id);
    res.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// DELETE banner (admin only)
router.delete('/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    console.log('✅ Banner deleted:', req.params.id);
    res.json({ ok: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// PATCH toggle banner active status (admin only)
router.patch('/:id/toggle', requireDb, requireAuth, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    banner.isActive = !banner.isActive;
    banner.updatedAt = new Date();
    await banner.save();
    
    console.log(`✅ Banner ${banner._id} ${banner.isActive ? 'activated' : 'deactivated'}`);
    res.json(banner);
  } catch (error) {
    console.error('Error toggling banner:', error);
    res.status(500).json({ error: 'Failed to toggle banner' });
  }
});
