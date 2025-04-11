
// This file handles Supabase client instantiation
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// You can update these values with your new Supabase project credentials
const SUPABASE_URL = "https://rdjfqdpoesjvbluffwzm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI";

/**
 * Helper function to validate URLs
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    console.error('Invalid Supabase URL:', urlString);
    return false;
  }
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  isValidUrl(SUPABASE_URL) ? SUPABASE_URL : "https://rdjfqdpoesjvbluffwzm.supabase.co", 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (url, options) => fetch(url, options),
    },
  }
);

/**
 * Initialize storage bucket for menu images
 * @returns {Promise<boolean>} True if bucket exists or was created, false otherwise
 */
export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'menu-images');
    
    if (!bucketExists) {
      console.error('The menu-images bucket does not exist in Supabase. Please create it in the dashboard or run SQL migrations.');
      return false;
    }
    
    console.log('Successfully verified menu-images bucket exists');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

/**
 * Upload an image to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucketName - The bucket name to upload to 
 * @returns {Promise<string|null>} The public URL if successful, null if failed
 */
export const uploadImage = async (file: File, bucketName: string = 'menu-images'): Promise<string | null> => {
  try {
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
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Test the connection to Supabase
 * @returns {Promise<boolean>} True if connected successfully, false otherwise
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a simple query to test connection
    const { error } = await supabase.from('settings').select('key').limit(1);
    
    if (error) {
      console.error('Failed to connect to Supabase:', error.message);
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
};
