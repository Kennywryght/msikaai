// backend/src/services/storage.js
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Upload an image to Supabase Storage
 * @param {Buffer|File} file - The image file
 * @param {string} bucket - Bucket name (listings, profiles, businesses)
 * @param {string} userId - User ID for folder organization
 * @param {Object} options - Optional settings
 * @returns {Promise<string>} Public URL of uploaded image
 */
export const uploadImage = async (file, bucket = 'listings', userId = 'public', options = {}) => {
  try {
    const {
      width = 800,
      height = 800,
      quality = 80,
      format = 'webp',
      fit = 'cover'
    } = options;

    // Generate unique filename
    const fileExt = file.originalname?.split('.').pop() || 'jpg';
    const fileName = `${userId}/${uuidv4()}.${format}`;

    // Optimize image with Sharp
    let imageBuffer = file.buffer || file;
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit })
      .toFormat(format, { quality })
      .toBuffer();

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, optimizedBuffer, {
        cacheControl: '31536000', // 1 year cache
        contentType: `image/${format}`,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of image files
 * @param {string} bucket - Bucket name
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of public URLs
 */
export const uploadMultipleImages = async (files, bucket = 'listings', userId = 'public') => {
  try {
    const uploadPromises = files.map(file => 
      uploadImage(file, bucket, userId, { width: 800, height: 800, quality: 80 })
    );
    
    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null);
  } catch (error) {
    console.error('Multiple upload error:', error);
    return [];
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} filePath - Full path of the file
 * @param {string} bucket - Bucket name
 * @returns {Promise<boolean>} Success status
 */
export const deleteImage = async (filePath, bucket = 'listings') => {
  try {
    // Extract path from URL if full URL is provided
    const path = filePath.includes('/storage/v1/object/public/')
      ? filePath.split('/').slice(-2).join('/')
      : filePath;

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Get public URL for a file
 * @param {string} filePath - File path
 * @param {string} bucket - Bucket name
 * @returns {string} Public URL
 */
export const getPublicUrl = (filePath, bucket = 'listings') => {
  if (!filePath) return null;
  
  // If it's already a full URL, return it
  if (filePath.startsWith('http')) return filePath;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return publicUrl;
};

/**
 * Optimize image buffer with Sharp
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} Optimized buffer
 */
export const optimizeImage = async (buffer, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'webp',
    fit = 'cover'
  } = options;

  return await sharp(buffer)
    .resize(width, height, { fit })
    .toFormat(format, { quality })
    .toBuffer();
};

/**
 * Get image metadata
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Image metadata
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Metadata error:', error);
    return null;
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getPublicUrl,
  optimizeImage,
  getImageMetadata,
};