import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  form_url: { type: String, default: '' }
});

export default mongoose.model('Event', EventSchema);
