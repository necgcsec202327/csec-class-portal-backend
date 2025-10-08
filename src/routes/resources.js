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
