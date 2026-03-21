import mongoose from 'mongoose';

/**
 * RentalJob Schema
 * Tracks GPU rental + setup progress from Vast.ai marketplace
 */
const RentalJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Vast.ai info
  vastInstanceId: {
    type: Number,
    default: null,
  },
  vastOfferId: {
    type: Number,
    required: true,
  },
  gpuName: {
    type: String,
    default: '',
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'renting', 'waiting_start', 'installing', 'configuring', 'starting_worker', 'ready', 'failed'],
    default: 'pending',
    index: true,
  },

  // Progress steps (for UI display)
  currentStep: {
    type: Number,
    default: 0,
  },
  steps: [{
    name: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
    },
    message: String,
    completedAt: Date,
  }],

  // Instance details once rented
  instanceDetails: {
    publicIp: String,
    sshPort: Number,
    workerPort: Number,
    workerUrl: String,
  },

  // Error info
  error: {
    message: String,
    step: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Auto-delete after 24 hours
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 },
  },
});

RentalJobSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.models.RentalJob || mongoose.model('RentalJob', RentalJobSchema);
