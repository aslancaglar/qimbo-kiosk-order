
/**
 * Utility for managing audio notifications in the application
 */

// Cache for storing preloaded audio objects
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Preload an audio file and store it in cache
 * @param url URL of the audio file to preload
 * @returns A promise that resolves when the audio is loaded
 */
export const preloadAudio = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if already in cache
      if (audioCache.has(url)) {
        resolve(audioCache.get(url)!);
        return;
      }

      // Create new audio element
      const audio = new Audio();
      audio.preload = 'auto';
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        audioCache.set(url, audio);
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        reject(new Error(`Failed to load audio from ${url}`));
      }, { once: true });
      
      // Start loading
      audio.src = url;
      audio.load();
    } catch (error) {
      console.error('Error preloading audio:', error);
      reject(error);
    }
  });
};

/**
 * Play an audio notification
 * @param url URL of the audio file to play
 * @returns A promise that resolves when playback starts or rejects on error
 */
export const playNotificationSound = async (url: string): Promise<void> => {
  try {
    if (!url) {
      console.warn('No audio URL provided for notification');
      return;
    }
    
    let audio: HTMLAudioElement;
    
    // Try to get from cache or load it
    if (audioCache.has(url)) {
      audio = audioCache.get(url)!;
    } else {
      audio = await preloadAudio(url);
    }
    
    // Reset playback position and play
    audio.currentTime = 0;
    
    // Use the play() promise API with fallback
    return audio.play()
      .catch(error => {
        console.error('Failed to play notification sound:', error);
        
        // Try creating a new audio instance as fallback
        if (error.name === 'NotAllowedError') {
          console.log('Autoplay blocked. User interaction required.');
          throw new Error('Audio autoplay blocked. User interaction required.');
        } else {
          // For other errors, try a fresh audio instance
          const freshAudio = new Audio(url);
          audioCache.set(url, freshAudio);
          return freshAudio.play();
        }
      });
  } catch (error) {
    console.error('Error playing notification sound:', error);
    throw error;
  }
};

/**
 * Clear the audio cache
 */
export const clearAudioCache = (): void => {
  audioCache.forEach(audio => {
    audio.pause();
    audio.src = '';
  });
  audioCache.clear();
};
