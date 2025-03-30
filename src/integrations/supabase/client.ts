
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rdjfqdpoesjvbluffwzm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkamZxZHBvZXNqdmJsdWZmd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjUwMzMsImV4cCI6MjA1ODYwMTAzM30.EZY4vaHzt11hJhV2MR8S1c9PJHhZpbv0NZIdBm24QZI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
});

// Initialize storage bucket if it doesn't exist
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
      console.log('Bucket does not exist, attempting to create it...');
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('menu-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });
        
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        return false;
      }
      console.log('Bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Call this when your app starts
initializeStorage();
