
import { supabase } from './client';

// Function to set up the Supabase middleware for restaurant ID
export const initializeSupabaseMiddleware = () => {
  const restaurantId = localStorage.getItem('restaurantId');
  
  if (restaurantId) {
    // Set up header for RLS policies
    supabase.functions.setAuth(restaurantId);
    
    // Set up a function to add restaurant_id to all inserts
    const originalFrom = supabase.from;
    
    // Override the from method to add restaurant_id to inserts
    supabase.from = function(table) {
      const query = originalFrom.call(this, table);
      
      // Store the original insert method
      const originalInsert = query.insert;
      
      // Override the insert method
      query.insert = function(values, options) {
        // Add restaurant_id to each inserted row
        let modifiedValues;
        
        if (Array.isArray(values)) {
          modifiedValues = values.map(row => ({
            ...row,
            restaurant_id: restaurantId
          }));
        } else {
          modifiedValues = {
            ...values,
            restaurant_id: restaurantId
          };
        }
        
        // Call the original insert with the modified values
        return originalInsert.call(this, modifiedValues, options);
      };
      
      return query;
    };
  }
  
  return supabase;
};

export default initializeSupabaseMiddleware;
