
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
        try {
          // Use a simplified approach to avoid deep type instantiation
          const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('restaurant_id', envRestaurantId)
            .eq('key', 'general_settings')
            .limit(1);
            
          if (data && data.length > 0) {
            // Use type assertion with a simpler type
            const settingsValue = data[0].value as Record<string, unknown>;
            if (settingsValue && 'name' in settingsValue) {
              currentRestaurant.name = String(settingsValue.name);
            }
          }
        } catch (error) {
          console.error('Error fetching restaurant name:', error);
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
