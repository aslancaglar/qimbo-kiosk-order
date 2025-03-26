
import { supabase } from "@/integrations/supabase/client";

/**
 * Enables real-time functionality for specified tables through Supabase
 * This function should be called once during application initialization
 */
export const enableRealtimeForTables = async () => {
  try {
    // Enable real-time for orders table by listening to the relevant channel
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Real-time notification received:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order updated:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order deleted:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    // Enable real-time for menu_items table
    const menuItemsChannel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('New menu item added:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('Menu item updated:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('Menu item deleted:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Menu items subscription status:', status);
      });
    
    console.log('Successfully enabled real-time for tables');
    
    return { ordersChannel, menuItemsChannel }; // Return the channels so they can be unsubscribed if needed
  } catch (error) {
    console.error('Error setting up real-time:', error);
    return null;
  }
};
