require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
console.log("MONGODB_URI:", process.env.MONGODB_URI);
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not defined');
    throw new Error('Please define the MONGODB_URI environment variable in Vercel');
  }

  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('🔌 Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

export default connectDB;
