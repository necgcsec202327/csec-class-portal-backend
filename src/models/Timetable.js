import mongoose from 'mongoose';

const TimetableSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  type: { type: String, enum: ['image','pdf'], default: 'image' }
});

export default mongoose.model('Timetable', TimetableSchema);
