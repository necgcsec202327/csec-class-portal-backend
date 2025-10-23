import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['urgent', 'important', 'info', 'success'],
    default: 'info'
  },
  message: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    default: '' 
  },
  linkText: {
    type: String,
    default: 'Learn More'
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  priority: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
BannerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Banner', BannerSchema);
