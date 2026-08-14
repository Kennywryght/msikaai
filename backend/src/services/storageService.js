// backend/src/services/storageService.js
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class StorageService {
  // Upload listing images - ✅ FIXED: Use correct bucket name 'listing-images'
  async uploadListingImages(files, businessId) {
    const uploadedUrls = [];
    
    // ✅ CORRECT BUCKET NAME from your Supabase
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
          console.error('Upload error:', error);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }

    console.log(`✅ Uploaded ${uploadedUrls.length} images to bucket: ${bucketName}`);
    return uploadedUrls;
  }

  // Upload business logo - ✅ FIXED: Use correct bucket name 'business-logos'
  async uploadLogo(file, businessId) {
    try {
      // ✅ CORRECT BUCKET NAME from your Supabase
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

      console.log(`✅ Logo uploaded to bucket: ${bucketName}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      return null;
    }
  }

  // Upload user avatar - ✅ FIXED: Use correct bucket name 'service-images'
  async uploadAvatar(file, userId) {
    try {
      // ✅ CORRECT BUCKET NAME from your Supabase
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

      console.log(`✅ Avatar uploaded to bucket: ${bucketName}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  }

  // Delete image
  async deleteImage(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      console.log(`✅ Deleted file from bucket: ${bucket}`);
      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }
}

export default new StorageService();