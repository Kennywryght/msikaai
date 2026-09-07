// backend/src/services/storageService.js
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import cloudinaryService from './cloudinaryService.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class StorageService {
  /**
   * Upload listing images - Uses Cloudinary if available, falls back to Supabase
   */
  async uploadListingImages(files, businessId) {
    // Check if Cloudinary is configured
    if (cloudinaryService.isConfigured) {
      logger.info('📤 Using Cloudinary for image upload...');
      const result = await cloudinaryService.uploadMultipleImages(files, {
        folder: `listings/${businessId}`,
        width: 800,
        height: 800,
        quality: 80,
      });

      if (result.success) {
        const urls = result.results
          .filter(r => r.success)
          .map(r => r.url);
        logger.info(`✅ Uploaded ${urls.length} images to Cloudinary`);
        return urls;
      } else {
        logger.warn('⚠️ Cloudinary upload failed, falling back to Supabase:', result.error);
        // Fall through to Supabase
      }
    }

    // Fallback: Upload to Supabase Storage
    logger.info('📤 Using Supabase Storage for image upload...');
    return this.uploadListingImagesToSupabase(files, businessId);
  }

  /**
   * Upload listing images to Supabase (fallback)
   */
  async uploadListingImagesToSupabase(files, businessId) {
    const uploadedUrls = [];
    const bucketName = 'listing-images';
    
    for (const file of files) {
      try {
        // Compress image
        const compressed = await sharp(file.buffer)
          .resize(800, 800, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const fileName = `${businessId}/${uuidv4()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, compressed, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (error) {
          logger.error('Upload error:', error);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        logger.error('Image upload error:', error);
      }
    }

    logger.info(`✅ Uploaded ${uploadedUrls.length} images to Supabase bucket: ${bucketName}`);
    return uploadedUrls;
  }

  /**
   * Upload business logo - Uses Cloudinary if available
   */
  async uploadLogo(file, businessId) {
    // Try Cloudinary first
    if (cloudinaryService.isConfigured) {
      logger.info('📤 Using Cloudinary for logo upload...');
      const result = await cloudinaryService.uploadLogo(file, businessId);
      if (result.success) {
        logger.info(`✅ Logo uploaded to Cloudinary for business ${businessId}`);
        return result.url;
      } else {
        logger.warn('⚠️ Cloudinary logo upload failed, falling back to Supabase:', result.error);
      }
    }

    // Fallback: Upload to Supabase
    logger.info('📤 Using Supabase Storage for logo upload...');
    return this.uploadLogoToSupabase(file, businessId);
  }

  /**
   * Upload business logo to Supabase (fallback)
   */
  async uploadLogoToSupabase(file, businessId) {
    try {
      const bucketName = 'business-logos';
      
      const compressed = await sharp(file.buffer)
        .resize(300, 300, { fit: 'contain' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const fileName = `${businessId}/logo.jpg`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compressed, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      logger.info(`✅ Logo uploaded to Supabase bucket: ${bucketName}`);
      return urlData.publicUrl;
    } catch (error) {
      logger.error('Logo upload error:', error);
      return null;
    }
  }

  /**
   * Upload user avatar - Uses Cloudinary if available
   */
  async uploadAvatar(file, userId) {
    // Try Cloudinary first
    if (cloudinaryService.isConfigured) {
      logger.info('📤 Using Cloudinary for avatar upload...');
      const result = await cloudinaryService.uploadAvatar(file, userId);
      if (result.success) {
        logger.info(`✅ Avatar uploaded to Cloudinary for user ${userId}`);
        return result.url;
      } else {
        logger.warn('⚠️ Cloudinary avatar upload failed, falling back to Supabase:', result.error);
      }
    }

    // Fallback: Upload to Supabase
    logger.info('📤 Using Supabase Storage for avatar upload...');
    return this.uploadAvatarToSupabase(file, userId);
  }

  /**
   * Upload user avatar to Supabase (fallback)
   */
  async uploadAvatarToSupabase(file, userId) {
    try {
      const bucketName = 'service-images';
      
      const compressed = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const fileName = `${userId}/avatar.jpg`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compressed, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      logger.info(`✅ Avatar uploaded to Supabase bucket: ${bucketName}`);
      return urlData.publicUrl;
    } catch (error) {
      logger.error('Avatar upload error:', error);
      return null;
    }
  }

  /**
   * Delete image - Supports both Cloudinary and Supabase
   */
  async deleteImage(bucket, path) {
    // Try Cloudinary first (if path is a Cloudinary public ID)
    if (cloudinaryService.isConfigured && path && !path.includes('supabase')) {
      try {
        const result = await cloudinaryService.deleteImage(path);
        if (result.success) {
          logger.info(`✅ Deleted from Cloudinary: ${path}`);
          return true;
        }
      } catch (error) {
        logger.warn('⚠️ Cloudinary delete failed, trying Supabase:', error.message);
      }
    }

    // Fallback: Delete from Supabase
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      logger.info(`✅ Deleted from Supabase bucket: ${bucket}`);
      return true;
    } catch (error) {
      logger.error('Delete image error:', error);
      return false;
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(bucket, paths) {
    const results = [];
    for (const path of paths) {
      const result = await this.deleteImage(bucket, path);
      results.push(result);
    }
    const successCount = results.filter(r => r).length;
    logger.info(`✅ Deleted ${successCount}/${paths.length} images`);
    return results;
  }

  /**
   * Get optimized URL (Cloudinary) or public URL (Supabase)
   */
  getOptimizedUrl(url, options = {}) {
    // If it's a Cloudinary URL, use Cloudinary optimization
    if (url && url.includes('cloudinary.com')) {
      const publicId = this.extractPublicIdFromUrl(url);
      if (publicId) {
        return cloudinaryService.getOptimizedUrl(publicId, options);
      }
    }
    // Return original URL for Supabase or other
    return url;
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicIdFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Find the part after 'upload/'
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Get everything after the version number
        const publicIdParts = pathParts.slice(uploadIndex + 2);
        return publicIdParts.join('/').replace(/\.[^.]+$/, '');
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  /**
   * Get storage service status
   */
  getStatus() {
    return {
      cloudinary: {
        configured: cloudinaryService.isConfigured,
      },
      supabase: {
        configured: true,
      },
    };
  }
}

export default new StorageService();