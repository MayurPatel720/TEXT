import mongoose from 'mongoose';

/**
 * Job Queue Schema
 * Manages generation jobs between Vercel and Vast.ai GPU worker
 */
const JobSchema = new mongoose.Schema({
  // User who created the job
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Job Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // Priority (higher = processed first)
  priority: {
    type: Number,
    default: 0, // 0 = normal, 10 = premium, 100 = urgent
    index: true,
  },
  
  // Input Data
  input: {
    imageData: {
      type: String, // Base64 encoded or GridFS file ID
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    settings: {
      seed: Number,
      guidance: { type: Number, default: 3.0 },
      denoise: { type: Number, default: 0.98 },
      steps: { type: Number, default: 25 },
    },
  },
  
  // Output Data (populated after completion)
  output: {
    imageId: {
      type: mongoose.Schema.Types.ObjectId, // GridFS file ID
    },
    imageUrl: String, // Direct URL if stored externally
    seed: Number,
  },
  
  // Execution Info
  execution: {
    workerIp: String,
    startedAt: Date,
    completedAt: Date,
    executionTime: Number, // in seconds
    retryCount: { type: Number, default: 0 },
  },
  
  // Error Info (if failed)
  error: {
    message: String,
    code: String,
    stack: String,
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  // TTL - auto-delete old jobs after 7 days
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    index: { expires: 0 },
  },
});

// Compound indexes for efficient queries
JobSchema.index({ status: 1, priority: -1, createdAt: 1 }); // For fetching next job
JobSchema.index({ userId: 1, createdAt: -1 }); // For user's job history

// Update timestamp on save
JobSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Static: Get next pending job (for worker polling)
JobSchema.statics.getNextPendingJob = async function() {
  return this.findOneAndUpdate(
    { status: 'pending' },
    { 
      status: 'processing',
      'execution.startedAt': new Date(),
    },
    { 
      sort: { priority: -1, createdAt: 1 },
      new: true,
    }
  );
};

// Static: Get queue stats
JobSchema.statics.getQueueStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  return stats.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, { pending: 0, processing: 0, completed: 0, failed: 0 });
};

// Instance: Mark as completed
JobSchema.methods.markCompleted = async function(output: { imageId?: string; imageUrl?: string; seed?: number }) {
  this.status = 'completed';
  this.output = output;
  this.execution.completedAt = new Date();
  this.execution.executionTime = 
    (this.execution.completedAt.getTime() - this.execution.startedAt.getTime()) / 1000;
  await this.save();
};

// Instance: Mark as failed
JobSchema.methods.markFailed = async function(error: { message: string; code?: string }) {
  this.status = 'failed';
  this.error = error;
  this.execution.completedAt = new Date();
  await this.save();
};

// Instance: Retry job
JobSchema.methods.retry = async function() {
  if (this.execution.retryCount >= 3) {
    await this.markFailed({ message: 'Max retries exceeded', code: 'MAX_RETRIES' });
    return false;
  }
  
  this.status = 'pending';
  this.execution.retryCount += 1;
  this.error = undefined;
  await this.save();
  return true;
};

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
