
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { RealtimePostgresChangesFilter } from "@supabase/supabase-js";

// Cache for notification settings
let notificationSettings = {
  soundEnabled: true,
  soundUrl: '/notification.mp3',
  volume: 1.0
};

/**
 * Fetches notification settings from the database
 */
const fetchNotificationSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'notification_settings')
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification settings:', error);
      return;
    }

    if (data && data.value) {
      const settings = data.value as Record<string, any>;
      notificationSettings = {
        soundEnabled: settings.soundEnabled !== undefined ? !!settings.soundEnabled : true,
        soundUrl: settings.soundUrl || '/notification.mp3',
        volume: settings.volume !== undefined ? Number(settings.volume) : 1.0
      };
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
  }
};

/**
 * Plays notification sound based on current settings
 */
const playNotificationSound = () => {
  if (!notificationSettings.soundEnabled) return;
  
  try {
    const audio = new Audio(notificationSettings.soundUrl);
    audio.volume = notificationSettings.volume;
    
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  } catch (error) {
    console.error('Error creating audio object:', error);
  }
};

/**
 * Enables real-time functionality for specified tables through Supabase
 * This function should be called once during application initialization
 */
export const enableRealtimeForTables = async () => {
  try {
    console.log('Setting up realtime for tables...');
    
    // Fetch notification settings first
    await fetchNotificationSettings();
    
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
            // Play notification sound
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
    
    // Also set up realtime for settings changes to update notification settings
    const settingsChannel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.notification_settings' } as RealtimePostgresChangesFilter<any>,
        async () => {
          console.log('Notification settings changed, refreshing...');
          await fetchNotificationSettings();
        }
      )
      .subscribe();
    
    console.log('Successfully enabled real-time for tables');
    
    return { ordersChannel, menuItemsChannel, settingsChannel }; // Return the channels so they can be unsubscribed if needed
  } catch (error) {
    console.error('Error setting up real-time:', error);
    return null;
  }
};
