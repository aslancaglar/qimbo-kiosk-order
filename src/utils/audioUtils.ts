
/**
 * Audio utilities for handling notification sounds
 */

// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preloads an audio file to improve playback reliability
 * 
 * @param url URL of the audio file to preload
 * @returns Promise that resolves when the audio is loaded or rejects on error
 */
export const preloadAudio = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    // Return cached audio if available
    if (audioCache[url]) {
      resolve(audioCache[url]);
      return;
    }

    const audio = new Audio();
    
    // Set up event handlers
    audio.addEventListener('canplaythrough', () => {
      audioCache[url] = audio;
      resolve(audio);
    }, { once: true });
    
    audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e);
      reject(new Error('Failed to load audio file. Please check the URL.'));
    }, { once: true });
    
    // Start loading the audio file
    audio.src = url;
    audio.load();
  });
};

/**
 * Plays a notification sound with fallbacks for browser compatibility
 * 
 * @param url URL of the audio file to play
 * @returns Promise that resolves when playback starts or rejects on error
 */
export const playNotificationSound = async (url: string): Promise<void> => {
  try {
    // Try to use cached or preloaded audio first
    let audio: HTMLAudioElement;
    
    try {
      audio = await preloadAudio(url);
    } catch (error) {
      // If preloading fails, try creating a new audio instance
      audio = new Audio(url);
    }
    
    // Reset audio if it was previously played
    audio.currentTime = 0;
    
    // Attempt to play the sound with user interaction
    await audio.play();
    
    console.log('Notification sound played successfully');
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    throw new Error('Failed to play sound. Please check the URL and try again.');
  }
};

