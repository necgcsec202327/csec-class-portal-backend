import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Timetable from '../models/Timetable.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = Router();

// Create uploads directory for timetables if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/timetables');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created timetable uploads directory:', uploadsDir);
}

// Configure multer for timetable uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `timetable-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Use PDF or image files.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for timetables
  }
});

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

// Timetable file upload endpoint
router.post('/upload', requireDb, requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📅 Timetable uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Determine type from mimetype
    const isPdf = req.file.mimetype === 'application/pdf';
    const fileUrl = `/uploads/timetables/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        type: isPdf ? 'pdf' : 'image',
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Timetable upload failed:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Serve uploaded timetable files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filepath);
});

// Delete uploaded timetable file
router.delete('/uploads/:filename', requireDb, requireAuth, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    fs.unlinkSync(filepath);
    console.log('🗑️  Timetable file deleted:', filename);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    res.status(500).json({ error: 'File deletion failed', details: error.message });
  }
});

