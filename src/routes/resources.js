import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import ResourceTree from '../models/ResourceTree.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDb } from '../middleware/dbReady.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️  Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET'
});

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

// File upload endpoint - Upload to Cloudinary
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

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️  Cloudinary not configured, falling back to base64');
      
      // Fallback to base64 if Cloudinary not configured
      const filepath = path.join(uploadsDir, req.file.filename);
      const fileBuffer = fs.readFileSync(filepath);
      const base64Data = fileBuffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      
      fs.unlinkSync(filepath);
      
      return res.json({
        success: true,
        file: {
          name: req.file.originalname,
          filename: req.file.filename,
          url: dataUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
          uploadedAt: new Date().toISOString(),
          storage: 'base64'
        }
      });
    }

    // Upload to Cloudinary
    const filepath = path.join(uploadsDir, req.file.filename);
    
    // Determine resource type based on mimetype
    let resourceType = 'raw'; // default for documents
    if (req.file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    console.log('☁️  Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(filepath, {
      folder: 'csec-class-portal/resources',
      resource_type: resourceType,
      public_id: req.file.filename.split('.')[0], // Remove extension
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    console.log('✅ Cloudinary upload successful:', uploadResult.secure_url);

    // Delete temporary file from disk
    fs.unlinkSync(filepath);
    console.log('🗑️  Temporary file deleted');

    // Return Cloudinary URL
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: uploadResult.secure_url, // Cloudinary URL
        cloudinary_id: uploadResult.public_id,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
        storage: 'cloudinary'
      }
    });
  } catch (error) {
    console.error('❌ File upload failed:', error);
    
    // Clean up temp file if it exists
    try {
      const filepath = path.join(uploadsDir, req.file?.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    
    res.status(500).json({ 
      error: 'File upload failed', 
      details: error.message 
    });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadsDir, filename);

  // 1) Serve from disk if present
  if (fs.existsSync(filepath)) {
    return res.sendFile(filepath);
  }

  // 2) If missing on disk and Cloudinary is configured, try to find and redirect
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      const publicId = `csec-class-portal/resources/${nameWithoutExt}`;
      const types = ['raw', 'image', 'video'];
      for (const resourceType of types) {
        try {
          const info = await cloudinary.api.resource(publicId, { resource_type: resourceType });
          if (info && info.secure_url) {
            return res.redirect(302, info.secure_url);
          }
        } catch (_) {
          // Continue trying other resource types
        }
      }
    }
  } catch (err) {
    console.warn('⚠️  Cloudinary lookup failed for', filename, err.message);
  }

  // 3) Not found anywhere
  return res.status(404).json({ error: 'File not found' });
});

// Delete uploaded file (works for both Cloudinary and local)
router.delete('/uploads/:filename', requireDb, requireAuth, async (req, res) => {
  const filename = req.params.filename;
  
  try {
    // Try to delete from Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const publicId = `csec-class-portal/resources/${filename.split('.')[0]}`;
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log('☁️  File deleted from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.warn('⚠️  Could not delete from Cloudinary:', cloudinaryError.message);
      }
    }
    
    // Try to delete from local disk (if exists)
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log('🗑️  File deleted from disk:', filename);
    }
    
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    res.status(500).json({ error: 'File deletion failed', details: error.message });
  }
});
