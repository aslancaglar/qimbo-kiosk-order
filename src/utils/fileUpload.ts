
import { supabase } from "@/integrations/supabase/client";

/**
 * Upload any file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} bucketName - The bucket name to upload to 
 * @returns {Promise<string|null>} The public URL if successful, null if failed
 */
export const uploadFile = async (file: File, bucketName: string = 'notification-sounds'): Promise<string | null> => {
  try {
    // Check if bucket exists or create it
    await ensureBucketExists(bucketName);
    
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
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
 * Ensure a storage bucket exists, create it if it doesn't
 * @param {string} bucketName - The name of the bucket to check/create
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // Create bucket if it doesn't exist
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false // Set to true to make bucket contents publicly accessible
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        return false;
      }
      
      console.log(`Bucket ${bucketName} created successfully`);
      
      // Set public bucket policy
      const { error: policyError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      });
      
      if (policyError) {
        console.error(`Error setting bucket ${bucketName} policy:`, policyError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};
