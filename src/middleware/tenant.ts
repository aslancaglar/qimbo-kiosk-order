
import { supabase } from '../integrations/supabase/client';

// Type for restaurant context
export type RestaurantContext = {
  id: string;
  name: string;
}

// Global restaurant context
let currentRestaurant: RestaurantContext | null = null;

/**
 * Initialize restaurant context from environment variables
 * This should be called when the application starts
 */
export const initRestaurantContext = async (): Promise<RestaurantContext> => {
  // Check if we already have the context
  if (currentRestaurant) {
    return currentRestaurant;
  }
  
  try {
    // Try to get restaurant ID from window.env (set during installation)
    const envRestaurantId = (window as any).env?.RESTAURANT_ID;
    const envRestaurantName = (window as any).env?.RESTAURANT_NAME;
    
    if (envRestaurantId) {
      // We have a restaurant ID from the environment
      console.log(`Initializing restaurant context for ID: ${envRestaurantId}`);
      
      currentRestaurant = {
        id: envRestaurantId,
        name: envRestaurantName || 'Restaurant'
      };
      
      // Try to get the restaurant name if not provided
      if (!envRestaurantName) {
        // Use typed query to avoid excessive type instantiation
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('restaurant_id', envRestaurantId)
          .eq('key', 'general_settings')
          .maybeSingle();
          
        if (!error && data?.value) {
          try {
            // Safely access the name property with explicit type casting
            const settingsValue = data.value as { name?: string };
            if (settingsValue && typeof settingsValue === 'object' && settingsValue.name) {
              currentRestaurant.name = settingsValue.name;
            }
          } catch (parseError) {
            console.error('Error parsing settings value:', parseError);
          }
        }
      }
      
      return currentRestaurant;
    }
    
    // Fallback to default values if no restaurant ID is found
    console.warn('No restaurant ID found in environment, using default');
    currentRestaurant = {
      id: 'default',
      name: 'Default Restaurant'
    };
    
    return currentRestaurant;
  } catch (error) {
    console.error('Error initializing restaurant context:', error);
    // Provide a default context to avoid app crashes
    currentRestaurant = {
      id: 'default',
      name: 'Default Restaurant'
    };
    
    return currentRestaurant;
  }
};

/**
 * Get the current restaurant context
 * This should be used throughout the application to get the current restaurant ID
 */
export const getRestaurantContext = (): RestaurantContext => {
  if (!currentRestaurant) {
    throw new Error('Restaurant context not initialized. Call initRestaurantContext first.');
  }
  
  return currentRestaurant;
};

/**
 * Utility function to add restaurant_id to any database query
 * @param query Supabase query
 * @returns Supabase query with restaurant_id filter
 */
export const withRestaurantId = (query: any) => {
  const { id } = getRestaurantContext();
  return query.eq('restaurant_id', id);
};
