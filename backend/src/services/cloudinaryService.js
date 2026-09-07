// backend/src/services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';
import sharp from 'sharp';
import { Readable } from 'stream';

class CloudinaryService {
  constructor() {
    this.isConfigured = false;
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = process.env.CLOUDINARY_API_KEY;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET;
    this.folder = process.env.CLOUDINARY_FOLDER || 'msikaai';

    if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      logger.info('✅ Cloudinary configured');
    } else {
      logger.warn('⚠️ Cloudinary not configured, using Supabase storage fallback');
    }
  }

  // ============================================
  // UPLOAD METHODS
  // ============================================

  /**
   * Upload a single image to Cloudinary
   */
  async uploadImage(file, options = {}) {
    if (!this.isConfigured) {
      logger.warn('⚠️ Cloudinary not configured');
      return { success: false, error: 'Cloudinary not configured' };
    }

    try {
      // Compress and optimize image before upload
      const optimizedBuffer = await this.optimizeImage(file.buffer, {
        width: options.width || 800,
        height: options.height || 800,
        quality: options.quality || 80,
        fit: options.fit || 'cover',
      });

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `${this.folder}/${options.folder || 'listings'}`,
            public_id: options.publicId || undefined,
            transformation: [
              { quality: 'auto:best' },
              { fetch_format: 'auto' },
            ],
            ...options,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // Create readable stream from buffer and pipe to Cloudinary
        const readableStream = new Readable();
        readableStream.push(optimizedBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });

      logger.info(`✅ Image uploaded to Cloudinary: ${result.public_id}`);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
      };
    } catch (error) {
      logger.error('❌ Cloudinary upload error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  async uploadMultipleImages(files, options = {}) {
    if (!this.isConfigured) {
      logger.warn('⚠️ Cloudinary not configured');
      return { success: false, error: 'Cloudinary not configured', results: [] };
    }

    const results = [];
    const folder = options.folder || 'listings';

    for (const file of files) {
      const result = await this.uploadImage(file, {
        ...options,
        folder: folder,
      });
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`✅ Uploaded ${successCount}/${files.length} images to Cloudinary`);

    return {
      success: successCount > 0,
      results,
      uploaded: successCount,
      total: files.length,
    };
  }

  /**
   * Upload a business logo
   */
  async uploadLogo(file, businessId) {
    if (!this.isConfigured) {
      logger.warn('⚠️ Cloudinary not configured');
      return { success: false, error: 'Cloudinary not configured' };
    }

    try {
      const result = await this.uploadImage(file, {
        folder: 'business-logos',
        publicId: `${businessId}/logo`,
        width: 300,
        height: 300,
        fit: 'contain',
        quality: 85,
      });

      if (result.success) {
        logger.info(`✅ Logo uploaded for business ${businessId}`);
      }
      return result;
    } catch (error) {
      logger.error('❌ Logo upload error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload a user avatar
   */
  async uploadAvatar(file, userId) {
    if (!this.isConfigured) {
      logger.warn('⚠️ Cloudinary not configured');
      return { success: false, error: 'Cloudinary not configured' };
    }

    try {
      const result = await this.uploadImage(file, {
        folder: 'avatars',
        publicId: `${userId}/avatar`,
        width: 200,
        height: 200,
        fit: 'cover',
        quality: 85,
      });

      if (result.success) {
        logger.info(`✅ Avatar uploaded for user ${userId}`);
      }
      return result;
    } catch (error) {
      logger.error('❌ Avatar upload error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // DELETE METHODS
  // ============================================

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId) {
    if (!this.isConfigured) {
      logger.warn('⚠️ Cloudinary not configured');
      return { success: false, error: 'Cloudinary not configured' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        logger.info(`✅ Image deleted: ${publicId}`);
        return { success: true, result };
      } else {
        logger.warn(`⚠️ Image not found: ${publicId}`);
        return { success: false, error: 'Image not found' };
      }
    } catch (error) {
      logger.error('❌ Delete image error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteMultipleImages(publicIds) {
    if (!this.isConfigured || !publicIds.length) {
      return { success: false, error: 'Cloudinary not configured or no IDs', results: [] };
    }

    const results = [];
    for (const publicId of publicIds) {
      const result = await this.deleteImage(publicId);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    logger.info(`✅ Deleted ${successCount}/${publicIds.length} images`);

    return {
      success: successCount > 0,
      results,
      deleted: successCount,
      total: publicIds.length,
    };
  }

  // ============================================
  // URL GENERATION METHODS
  // ============================================

  /**
   * Get optimized URL for an image
   */
  getOptimizedUrl(publicId, options = {}) {
    if (!this.isConfigured) {
      return publicId;
    }

    const transformations = [];

    // Resize
    if (options.width || options.height) {
      const crop = options.crop || 'limit';
      transformations.push({
        width: options.width || 'auto',
        height: options.height || 'auto',
        crop: crop,
      });
    }

    // Quality
    transformations.push({
      quality: options.quality || 'auto:best',
    });

    // Format
    transformations.push({
      fetch_format: options.format || 'auto',
    });

    // Effects
    if (options.effect) {
      transformations.push({
        effect: options.effect,
      });
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId, width = 300, height = 300) {
    return this.getOptimizedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 80,
    });
  }

  /**
   * Get responsive URL for different screen sizes
   */
  getResponsiveUrl(publicId, sizes = [300, 600, 900]) {
    if (!this.isConfigured) {
      return publicId;
    }

    return cloudinary.url(publicId, {
      transformation: [
        {
          quality: 'auto:best',
          fetch_format: 'auto',
        },
        {
          width: 'auto',
          crop: 'limit',
          dpr: 'auto',
        },
      ],
      responsive: true,
      width: sizes,
      secure: true,
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Optimize image before upload using Sharp
   */
  async optimizeImage(buffer, options = {}) {
    const width = options.width || 800;
    const height = options.height || 800;
    const quality = options.quality || 80;
    const fit = options.fit || 'cover';

    try {
      let sharpInstance = sharp(buffer);

      // Resize if dimensions provided
      if (options.width || options.height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: fit,
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG and set quality
      sharpInstance = sharpInstance.jpeg({ quality });

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.error('Image optimization error:', error.message);
      return buffer; // Return original buffer on error
    }
  }

  /**
   * Get image info from Cloudinary
   */
  async getImageInfo(publicId) {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        tags: result.tags || [],
      };
    } catch (error) {
      logger.error('Get image info error:', error.message);
      return null;
    }
  }

  /**
   * Generate upload signature for client-side uploads
   */
  generateUploadSignature(options = {}) {
    if (!this.isConfigured) {
      return null;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = options.folder || this.folder;

    const params = {
      timestamp: timestamp,
      folder: folder,
      ...options,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
      ...params,
    };
  }

  /**
   * Get storage usage stats
   */
  async getStorageStats() {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const result = await cloudinary.api.usage();
      return {
        storage: {
          used: result.storage_usage,
          limit: result.storage_limit,
          usedPercent: (result.storage_usage / result.storage_limit) * 100,
        },
        bandwidth: {
          used: result.bandwidth_usage,
          limit: result.bandwidth_limit,
          usedPercent: (result.bandwidth_usage / result.bandwidth_limit) * 100,
        },
        requests: result.requests,
        resources: result.resources,
      };
    } catch (error) {
      logger.error('Get storage stats error:', error.message);
      return null;
    }
  }

  /**
   * Check if Cloudinary is configured
   */
  get isConfigured() {
    return this._isConfigured;
  }

  set isConfigured(value) {
    this._isConfigured = value;
  }
}

// Create singleton instance
const cloudinaryService = new CloudinaryService();

export default cloudinaryService;