import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import ResourceTree from '../src/models/ResourceTree.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set. Export it or create a .env file with MONGODB_URI.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Cloudinary env vars not set. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary configured for migration');
}

function walk(node, fn) {
  fn(node);
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => walk(child, fn));
  }
}

async function findCloudinaryUrlForFilename(filename) {
  // Filename like 1762100659704-732174238-CN___IP_MODULE-4.docx
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  // Our upload used folder 'csec-class-portal/resources' and public_id = nameWithoutExt
  const publicId = `csec-class-portal/resources/${nameWithoutExt}`;

  // Try raw first (documents)
  try {
    const res = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    return res.secure_url;
  } catch {}

  // Try image
  try {
    const res = await cloudinary.api.resource(publicId, { resource_type: 'image' });
    return res.secure_url;
  } catch {}

  // Try video
  try {
    const res = await cloudinary.api.resource(publicId, { resource_type: 'video' });
    return res.secure_url;
  } catch {}

  // As a fallback, try a search by prefix (can be slower)
  try {
    const prefix = `csec-class-portal/resources/${nameWithoutExt}`;
    const search = await cloudinary.search.expression(`public_id:${prefix}*`).max_results(5).execute();
    const match = search.resources && search.resources[0];
    if (match && match.secure_url) return match.secure_url;
  } catch {}

  return null;
}

async function migrate() {
  await connectDb();
  configureCloudinary();

  const doc = await ResourceTree.findOne();
  if (!doc) {
    console.log('No ResourceTree found. Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  const root = doc.root;
  let totalFiles = 0;
  let legacyCount = 0;
  let updatedCount = 0;
  const failures = [];

  walk(root, (node) => {
    if (node.type === 'file') totalFiles++;
  });

  console.log(`🔎 Scanning ${totalFiles} files for legacy /uploads URLs...`);

  // Traverse and update in-place
  async function processNode(node) {
    if (node.type === 'file' && typeof node.url === 'string' && node.url.startsWith('/uploads/')) {
      legacyCount++;
      const filename = path.basename(node.url);
      process.stdout.write(`\n➡️  ${filename} ... `);
      const cloudUrl = await findCloudinaryUrlForFilename(filename);
      if (cloudUrl) {
        node.url = cloudUrl;
        updatedCount++;
        process.stdout.write('✅ replaced');
      } else {
        failures.push(filename);
        process.stdout.write('❌ not found in Cloudinary');
      }
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  await processNode(root);

  if (updatedCount > 0) {
    doc.markModified('root');
    await doc.save();
    console.log(`\n💾 Saved updates to database.`);
  }

  console.log(`\n📊 Migration summary:`);
  console.log(`- Legacy /uploads files found: ${legacyCount}`);
  console.log(`- Updated to Cloudinary URLs: ${updatedCount}`);
  console.log(`- Not found in Cloudinary: ${failures.length}`);
  if (failures.length) {
    console.log('Missing files:');
    failures.forEach((f) => console.log('  -', f));
  }

  await mongoose.disconnect();
  console.log('✅ Done');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
