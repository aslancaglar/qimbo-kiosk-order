
import { supabase } from "@/integrations/supabase/client";

/**
 * Upload any file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} bucketName - The bucket name to upload to 
 * @returns {Promise<string|null>} The public URL if successful, null if failed
 */
export const uploadFile = async (file: File, bucketName: string = 'menu-images'): Promise<string | null> => {
  try {
    console.log(`Attempting to upload file to ${bucketName} bucket...`);
    
    // Check if we have permission to access this bucket (use menu-images as fallback)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // Fall back to menu-images bucket which should exist
      bucketName = 'menu-images';
    } else {
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Bucket ${bucketName} not found. Using menu-images bucket instead.`);
        // Fall back to menu-images bucket
        bucketName = 'menu-images';
      }
    }
    
    // Create a unique file path including original file extension
    const fileExt = file.name.split('.').pop();
    const fileName = `notification-sounds/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    console.log(`Uploading file ${fileName} to ${bucketName} bucket...`);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    console.log('File uploaded successfully:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    console.log('Public URL:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * This function is kept for compatibility but now we use the 
 * menu-images bucket with a notification-sounds/ prefix
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  return true; // We're no longer creating buckets, just using existing ones
};

