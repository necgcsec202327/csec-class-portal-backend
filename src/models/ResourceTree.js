import mongoose from 'mongoose';

// Use a flexible schema that accepts any structure for the root
const ResourceTreeSchema = new mongoose.Schema({
  root: { type: mongoose.Schema.Types.Mixed, required: true }
}, { 
  minimize: false,  // Don't remove empty objects
  strict: false     // Allow additional fields
});

export default mongoose.model('ResourceTree', ResourceTreeSchema);
