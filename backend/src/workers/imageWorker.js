// backend/src/workers/imageWorker.js
import { logger } from '../utils/logger.js';
import queueService from '../services/queueService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

class ImageWorker {
  async processImage(data) {
    const { file, options, callback, metadata } = data;

    try {
      logger.info('🖼️ Processing image...');

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(file, options);

      if (result.error) {
        logger.error('Image upload failed:', result.error);
        throw new Error(result.error);
      }

      logger.info(`✅ Image processed: ${result.publicId}`);
      
      return {
        success: true,
        url: result.url,
        publicId: result.publicId,
        metadata: metadata || {},
      };
    } catch (error) {
      logger.error('Image processing error:', error.message);
      throw error;
    }
  }

  async start() {
    logger.info('🚀 Starting Image Processing Worker...');

    try {
      await queueService.consume('imageProcessing', async (data) => {
        await this.processImage(data);
      });

      logger.info('✅ Image Processing Worker started successfully');
    } catch (error) {
      logger.error('Failed to start Image Processing Worker:', error.message);
      process.exit(1);
    }
  }
}

// Run the worker if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new ImageWorker();
  worker.start().catch((error) => {
    logger.error('Worker error:', error);
    process.exit(1);
  });
}

export default ImageWorker;