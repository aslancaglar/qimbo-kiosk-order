
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { RealtimePostgresChangesFilter } from "@supabase/supabase-js";

const NOTIFICATION_SOUND_URL = "http://guqe0132.odns.fr/simple-notification-152054.mp3";

// We'll use an array to queue sound requests
let soundQueue = [];
let isPlaying = false;

/**
 * Play a notification sound, handling browser restrictions
 */
const playNotificationSound = () => {
  // Add this sound to the queue
  soundQueue.push(1);
  
  // If already playing, the next sound will be handled by the queue
  if (isPlaying) return;
  
  // Process the queue recursively
  const processQueue = () => {
    if (soundQueue.length === 0) {
      isPlaying = false;
      return;
    }
    
    isPlaying = true;
    soundQueue.shift(); // Remove the current item
    
    try {
      const sound = new Audio(NOTIFICATION_SOUND_URL);
      sound.volume = 1.0;
      
      // When this sound ends, play the next one if there is any
      sound.onended = processQueue;
      sound.onerror = () => {
        console.error("Error playing sound");
        processQueue(); // Try the next sound
      };
      
      // Play and handle errors
      sound.play().catch(err => {
        console.error('Failed to play notification sound:', err);
        processQueue(); // Try the next sound on error
      });
    } catch (err) {
      console.error('Error creating audio:', err);
      processQueue(); // Try the next sound on error
    }
  };
  
  // Start processing queue if not already playing
  if (!isPlaying) {
    processQueue();
  }
};

/**
 * Enables real-time functionality for specified tables through Supabase
 * This function should be called once during application initialization
 */
export const enableRealtimeForTables = async () => {
  try {
    console.log('Setting up realtime for tables...');
    
    // Enable real-time for orders table by listening to the relevant channel
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' } as RealtimePostgresChangesFilter<any>,
        (payload) => {
          console.log('Real-time order notification received:', payload);
          
          // Show toast notification for new orders
          if (payload.eventType === 'INSERT') {
            // Play notification sound for new orders
            playNotificationSound();
            
            toast({
              title: "New Order Received",
              description: `Order #${payload.new.id} has been created with status: ${payload.new.status}`,
            });
            
            // Log to verify we're receiving new orders
            console.log('New order created and detected by realtime:', payload.new);
          } else if (payload.eventType === 'UPDATE') {
            console.log('Order updated:', payload.new);
            toast({
              title: "Order Updated",
              description: `Order #${payload.new.id} status changed to ${payload.new.status}`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Orders realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to orders changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to orders changes');
        }
      });
    
    // Enable real-time for menu_items table
    const menuItemsChannel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' } as RealtimePostgresChangesFilter<any>,
        (payload) => {
          console.log('Menu item change notification:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Menu items subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to menu items changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to menu items changes');
        }
      });
    
    console.log('Successfully enabled real-time for tables');
    
    return { ordersChannel, menuItemsChannel }; // Return the channels so they can be unsubscribed if needed
  } catch (error) {
    console.error('Error setting up real-time:', error);
    return null;
  }
};
