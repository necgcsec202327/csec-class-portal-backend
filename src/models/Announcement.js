import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Announcement', AnnouncementSchema);
