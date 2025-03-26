
import { supabase } from "@/integrations/supabase/client";

/**
 * Enables real-time functionality for specified tables through Supabase
 * This function should be called once during application initialization
 */
export const enableRealtimeForTables = async () => {
  try {
    // Enable real-time for orders table
    const { error } = await supabase.rpc('supabase_realtime', {
      table_name: 'orders',
      action: 'insert,update,delete'
    });
    
    if (error) {
      console.error('Error enabling real-time for orders:', error);
    } else {
      console.log('Successfully enabled real-time for orders table');
    }
  } catch (error) {
    console.error('Error setting up real-time:', error);
  }
};
