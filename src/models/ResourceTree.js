import mongoose from 'mongoose';

// Define a self-referencing schema in two steps
const NodeSchema = new mongoose.Schema({}, { _id: false });
NodeSchema.add({
  name: String,
  type: { type: String, enum: ['folder','file'], required: true },
  url: String,
  tags: { type: Object },
  children: [NodeSchema]
});

const ResourceTreeSchema = new mongoose.Schema({
  root: { type: NodeSchema, required: true }
});

export default mongoose.model('ResourceTree', ResourceTreeSchema);
