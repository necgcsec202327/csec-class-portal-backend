import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ResourceTree from '../models/ResourceTree.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const safeFilename = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeFilename}${ext}`);
  }
});

// File filter to accept common file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

router.get('/', requireDb, async (req, res) => {
  const doc = await ResourceTree.findOne().lean();
  if (!doc) return res.json({ name:'Resources', type:'folder', children: [] });
  res.json(doc.root);
});

router.put('/', requireDb, requireAuth, async (req, res) => {
  console.log('🌳 Resources PUT request body keys:', Object.keys(req.body));
  console.log('🌳 Resources PUT request size:', JSON.stringify(req.body).length, 'characters');
  
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

// New endpoint to get file metadata and stats
router.get('/stats', requireDb, async (req, res) => {
  try {
    const doc = await ResourceTree.findOne().lean();
    if (!doc) return res.json({ totalFiles: 0, totalFolders: 0, totalSize: 0 });
    
    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;
    
    const traverse = (node) => {
      if (node.type === 'folder') {
        folderCount++;
        if (node.children) {
          node.children.forEach(traverse);
        }
      } else if (node.type === 'file') {
        fileCount++;
        if (node.url && node.url.startsWith('data:')) {
          // Calculate base64 size
          const base64 = node.url.split(',')[1];
          if (base64) {
            totalSize += (base64.length * 3) / 4;
          }
        }
      }
    };
    
    traverse(doc.root);
    
    res.json({ 
      totalFiles: fileCount, 
      totalFolders: folderCount, 
      totalSize: Math.round(totalSize),
      formattedSize: formatBytes(totalSize)
    });
  } catch (error) {
    console.error('❌ Resources stats failed:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File upload endpoint - Store as base64 in database
router.post('/upload', requireDb, requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📤 File uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Read file and convert to base64
    const filepath = path.join(uploadsDir, req.file.filename);
    const fileBuffer = fs.readFileSync(filepath);
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
    
    // Delete the temporary file from disk
    fs.unlinkSync(filepath);
    console.log('🗑️  Temporary file deleted from disk');

    // Return base64 data URL (will be stored directly in database)
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: dataUrl, // Base64 data URL instead of file path
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ File upload failed:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filepath);
});

// Delete uploaded file
router.delete('/uploads/:filename', requireDb, requireAuth, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    fs.unlinkSync(filepath);
    console.log('🗑️  File deleted:', filename);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    res.status(500).json({ error: 'File deletion failed', details: error.message });
  }
});
