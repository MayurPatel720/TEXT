import mongoose from 'mongoose';

const GenerationSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // For fast queries
  },
  
  // Input Data
  prompt: {
    type: String,
    required: true,
  },
  referenceImageUrl: {
    type: String, // URL of uploaded reference image
  },
  
  // Output Data
  generatedImageUrl: {
    type: String,
    required: false, // Made optional - we may use GridFS instead
  },
  // GridFS image storage (for self-hosted backend)
  generatedImageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'images.files', // GridFS collection
  },
  replicateId: {
    type: String, // Replicate prediction ID (legacy)
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job', // Reference to the job queue
  },
  
  // Backend source
  backend: {
    type: String,
    enum: ['replicate', 'self-hosted'],
    default: 'self-hosted',
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  modelVersion: {
    type: String,
    default: 'flux-kontext-dev',
  },
  generationTime: {
    type: Number, // Time taken in seconds
  },
  
  // User Actions
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: false, // For showcase
  },
  
  // Analytics
  downloads: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // For sorting by date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for user's generations sorted by date
GenerationSchema.index({ userId: 1, createdAt: -1 });

// Update the updatedAt timestamp before saving
GenerationSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Static method to get user's generation history
GenerationSchema.statics.getUserHistory = async function(userId: string, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get user's favorites
GenerationSchema.statics.getUserFavorites = async function(userId: string) {
  return this.find({ userId, isFavorite: true })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to get public generations for showcase
GenerationSchema.statics.getPublicGenerations = async function(limit = 50) {
  return this.find({ isPublic: true, status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name image')
    .lean();
};

export default mongoose.models.Generation || mongoose.model('Generation', GenerationSchema);
