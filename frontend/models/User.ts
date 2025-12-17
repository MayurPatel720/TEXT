import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  emailVerified: {
    type: Date,
  },
  
  // Subscription & Plan
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  credits: {
    type: Number,
    default: 5, // Free tier gets 5 credits
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'inactive',
  },
  subscriptionId: {
    type: String, // Razorpay subscription ID
  },
  
  // Usage Tracking
  totalGenerations: {
    type: Number,
    default: 0,
  },
  generationsThisMonth: {
    type: Number,
    default: 0,
  },
  lastGenerationDate: {
    type: Date,
  },
  
  // Payment History
  customerId: {
    type: String, // Razorpay customer ID
  },
  lastPaymentDate: {
    type: Date,
  },
  nextBillingDate: {
    type: Date,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to deduct credits
UserSchema.methods.deductCredits = async function(amount = 1) {
  if (this.credits < amount) {
    throw new Error('Insufficient credits');
  }
  this.credits -= amount;
  this.totalGenerations += amount;
  this.generationsThisMonth += amount;
  this.lastGenerationDate = new Date();
  await this.save();
  return this.credits;
};

// Method to add credits
UserSchema.methods.addCredits = async function(amount) {
  this.credits += amount;
  await this.save();
  return this.credits;
};

// Method to reset monthly counter (call this via cron job)
UserSchema.methods.resetMonthlyUsage = async function() {
  this.generationsThisMonth = 0;
  await this.save();
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
