
// This file dynamically selects Supabase credentials based on hostname
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration object for different restaurant instances
const RESTAURANT_CONFIGS = {
  // Default restaurant (main domain)
  'default': {
    url: "https://rdjfqdpoesjvbluffwzm.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI"
  },
  // Add more restaurants with their own Supabase credentials
  'restaurant1.yourdomain.com': {
    url: "https://your-restaurant1-supabase-url.supabase.co",
    key: "your-restaurant1-supabase-anon-key"
  },
  'restaurant2.yourdomain.com': {
    url: "https://your-restaurant2-supabase-url.supabase.co",
    key: "your-restaurant2-supabase-anon-key"
  },
  // Add more configurations as needed
};

// Helper function to get the current hostname
const getHostname = () => {
  return typeof window !== 'undefined' ? window.location.hostname : '';
};

// Select the appropriate configuration based on the hostname
const getSupabaseConfig = () => {
  const hostname = getHostname();
  
  // Look for a direct match in the configuration
  if (RESTAURANT_CONFIGS[hostname]) {
    console.log(`Using configuration for ${hostname}`);
    return RESTAURANT_CONFIGS[hostname];
  }
  
  // If no direct match, use default
  console.log(`No specific configuration found for ${hostname}, using default`);
  return RESTAURANT_CONFIGS.default;
};

// Get the configuration based on the current hostname
const config = getSupabaseConfig();
const SUPABASE_URL = config.url;
const SUPABASE_PUBLISHABLE_KEY = config.key;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options) => fetch(url, options),
  },
});

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

// Call this when your app starts
// We don't want to initialize storage here because it might fail if the bucket doesn't exist yet
// Instead, we'll check for the bucket's existence right before uploading
