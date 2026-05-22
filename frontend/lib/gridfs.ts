import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

let bucket: GridFSBucket | null = null;

/**
 * Get or create GridFS bucket for image storage
 */
export function getGridFSBucket(): GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB not connected');
    }
    bucket = new GridFSBucket(db, { bucketName: 'images' });
  }
  return bucket;
}

/**
 * Upload an image to GridFS
 * @param imageData - Buffer or base64 string of the image
 * @param filename - Name to store the file as
 * @param metadata - Optional metadata (userId, jobId, etc.)
 * @returns The ObjectId of the stored file
 */
export async function uploadImage(
  imageData: Buffer | string,
  filename: string,
  metadata?: Record<string, any>
): Promise<ObjectId> {
  const bucket = getGridFSBucket();
  
  // Convert base64 to buffer if needed
  const buffer = typeof imageData === 'string' 
    ? Buffer.from(imageData, 'base64')
    : imageData;
  
  // Create upload stream
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      ...metadata,
      contentType: 'image/png',
      uploadedAt: new Date(),
    },
  });
  
  // Write and close
  uploadStream.write(buffer);
  uploadStream.end();
  
  // Wait for upload to complete
  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => resolve(uploadStream.id as ObjectId));
    uploadStream.on('error', reject);
  });
}

/**
 * Download an image from GridFS
 * @param fileId - ObjectId or string ID of the file
 * @returns Buffer containing the image data
 */
export async function downloadImage(fileId: ObjectId | string): Promise<Buffer> {
  const bucket = getGridFSBucket();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  
  const downloadStream = bucket.openDownloadStream(id);
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
    downloadStream.on('error', reject);
  });
}

/**
 * Delete an image from GridFS
 * @param fileId - ObjectId or string ID of the file
 */
export async function deleteImage(fileId: ObjectId | string): Promise<void> {
  const bucket = getGridFSBucket();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  await bucket.delete(id);
}

/**
 * Get file info from GridFS
 * @param fileId - ObjectId or string ID of the file
 */
export async function getImageInfo(fileId: ObjectId | string): Promise<any> {
  const bucket = getGridFSBucket();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  
  const files = await bucket.find({ _id: id }).toArray();
  return files[0] || null;
}

/**
 * Create a readable stream for an image (for streaming responses)
 * @param fileId - ObjectId or string ID of the file
 */
export function createImageStream(fileId: ObjectId | string) {
  const bucket = getGridFSBucket();
  const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  return bucket.openDownloadStream(id);
}
