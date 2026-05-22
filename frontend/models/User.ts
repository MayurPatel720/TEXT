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
    required: false, // Not required for OAuth users
  },
  image: {
    type: String,
  },
  emailVerified: {
    type: Date,
  },

  // Auth Provider (for OAuth)
  authProvider: {
    type: String,
    enum: ['credentials', 'google', 'github'],
    default: 'credentials',
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false, // Don't include in queries by default
  },
  twoFactorBackupCodes: {
    type: [String],
    select: false,
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

  // Session & Security
  lastLoginAt: {
    type: Date,
  },
  lastLoginIp: {
    type: String,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: {
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

  // Password Reset
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
});

// Indexes for performance
// Note: email index is already created by unique: true in schema definition
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
UserSchema.pre('save', function () {
  this.updatedAt = new Date();
});

// Method to deduct credits
UserSchema.methods.deductCredits = async function (amount = 1) {
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
UserSchema.methods.addCredits = async function (amount: number) {
  this.credits += amount;
  await this.save();
  return this.credits;
};

// Method to reset monthly counter (call this via cron job)
UserSchema.methods.resetMonthlyUsage = async function () {
  this.generationsThisMonth = 0;
  await this.save();
};

// Method to record login
UserSchema.methods.recordLogin = async function (ip: string) {
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
  this.failedLoginAttempts = 0;
  await this.save();
};

// Method to record failed login
UserSchema.methods.recordFailedLogin = async function () {
  this.failedLoginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await this.save();
};

// Method to check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Method to enable 2FA
UserSchema.methods.enable2FA = async function (secret: string, backupCodes: string[]) {
  this.twoFactorEnabled = true;
  this.twoFactorSecret = secret;
  this.twoFactorBackupCodes = backupCodes;
  await this.save();
};

// Method to disable 2FA
UserSchema.methods.disable2FA = async function () {
  this.twoFactorEnabled = false;
  this.twoFactorSecret = undefined;
  this.twoFactorBackupCodes = undefined;
  await this.save();
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
