
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { RealtimePostgresChangesFilter } from "@supabase/supabase-js";

// Cache for notification settings
let notificationSettings = {
  soundEnabled: true,
  soundUrl: '/notification.mp3',
  volume: 1.0
};

// Keep track of audio instance for cleanup
let notificationAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let audioInitialized = false;

/**
 * Initializes Web Audio API to unlock audio playback restrictions
 */
const initializeAudio = () => {
  if (audioInitialized || typeof window === 'undefined') return;
  
  try {
    // Initialize audio context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create and play a silent sound to unlock the audio context
    if (audioContext && audioContext.state === 'suspended') {
      const silentSound = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent
      silentSound.connect(gainNode);
      gainNode.connect(audioContext.destination);
      silentSound.start();
      silentSound.stop(0.001);
      
      audioContext.resume().then(() => {
        console.log('Audio context resumed successfully');
      });
    }
    
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    audioInitialized = true;
    console.log('Audio initialized successfully');
  } catch (error) {
    console.error('Error initializing audio:', error);
  }
};

/**
 * Handler to unlock audio on user interaction
 */
const unlockAudio = () => {
  console.log('User interaction detected, initializing audio...');
  initializeAudio();
};

/**
 * Fetches notification settings from the database
 */
const fetchNotificationSettings = async () => {
  try {
    console.log('Fetching notification settings...');
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
      console.log('Notification settings loaded:', notificationSettings);
      
      // Preload the new sound
      preloadNotificationSound();
    } else {
      console.log('No notification settings found, using defaults');
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
  }
};

/**
 * Preloads the notification sound to improve playback reliability
 */
const preloadNotificationSound = () => {
  if (notificationAudio) {
    notificationAudio.pause();
    notificationAudio.remove();
  }
  
  try {
    console.log('Preloading notification sound from URL:', notificationSettings.soundUrl);
    notificationAudio = new Audio(notificationSettings.soundUrl);
    notificationAudio.preload = 'auto';
    notificationAudio.volume = notificationSettings.volume;
    
    // Force a load attempt
    notificationAudio.load();
    
    // Try to play a silent test to check if the sound can be played
    const testPlay = notificationAudio.play();
    
    if (testPlay) {
      testPlay
        .then(() => {
          console.log('Test play successful, sound is ready');
          notificationAudio?.pause();
          notificationAudio?.load(); // Reload the sound for future use
        })
        .catch(error => {
          console.warn('Test play failed, sound may need user interaction:', error);
          // Will require user interaction to play
        });
    }
  } catch (error) {
    console.error('Error preloading notification sound:', error);
  }
};

/**
 * Plays notification sound based on current settings
 */
const playNotificationSound = () => {
  if (!notificationSettings.soundEnabled) {
    console.log('Sound is disabled in settings');
    return;
  }
  
  try {
    console.log('Attempting to play notification sound:', notificationSettings.soundUrl, 'at volume', notificationSettings.volume);
    
    if (!audioInitialized && typeof window !== 'undefined') {
      console.log('Audio not initialized, trying to initialize...');
      initializeAudio();
    }
    
    // Always create a new Audio instance for more reliable playback
    const audio = new Audio(notificationSettings.soundUrl);
    audio.volume = notificationSettings.volume;
    
    console.log('Playing notification sound:', notificationSettings.soundUrl);
    
    // Play the sound with better error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Sound played successfully');
        })
        .catch(error => {
          console.error('Error playing notification sound:', error);
          
          if (error.name === 'NotAllowedError') {
            toast({
              title: "Sound requires interaction",
              description: "Please click anywhere on the page to enable sound notifications",
            });
            
            // If in a browser context, add listeners to unlock audio
            if (typeof window !== 'undefined' && !audioInitialized) {
              document.addEventListener('click', unlockAudio);
              document.addEventListener('touchstart', unlockAudio);
            }
          }
        });
    }
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
    
    // Initialize audio context if we're in a browser
    if (typeof window !== 'undefined') {
      document.addEventListener('click', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
    }
    
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
