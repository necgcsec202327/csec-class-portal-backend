import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Announcement from './models/Announcement.js';
import Event from './models/Event.js';
import ResourceTree from './models/ResourceTree.js';
import Timetable from './models/Timetable.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootFront = path.resolve(__dirname, '../../frontend');

async function run(){
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error('MONGO_URI not set');
  await mongoose.connect(MONGO_URI);
  console.log('Connected');

  const readJson = (p)=> JSON.parse(fs.readFileSync(p, 'utf8'));
  const ann = readJson(path.join(rootFront, 'data/announcements.json'));
  const ev = readJson(path.join(rootFront, 'data/events.json'));
  const res = readJson(path.join(rootFront, 'data/resources.json'));
  const tt = readJson(path.join(rootFront, 'data/timetable.json'));

  await Announcement.deleteMany({}); await Announcement.insertMany(ann);
  await Event.deleteMany({}); await Event.insertMany(ev);
  await ResourceTree.deleteMany({}); await ResourceTree.create({ root: (res.type==='folder' ? res : {
    name:'Resources', type:'folder', children:[
      { name:'Notes', type:'folder', children:(res.notes||[]).map(x=>({ name:x.title, type:'file', url:x.url })) },
      { name:'Slides', type:'folder', children:(res.slides||[]).map(x=>({ name:x.title, type:'file', url:x.url })) },
      { name:'Recordings', type:'folder', children:(res.recordings||[]).map(x=>({ name:x.title, type:'file', url:x.url })) },
      { name:'External Links', type:'folder', children:(res.external_links||[]).map(x=>({ name:x.title, type:'file', url:x.url })) }
    ]
  }) });
  await Timetable.deleteMany({}); await Timetable.create({ url: tt.url||'', type: tt.type==='pdf'?'pdf':'image' });

  console.log('Seeded');
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
