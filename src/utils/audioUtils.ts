
/**
 * Utility for managing audio notifications in the application
 */

// Cache for storing preloaded audio objects
const audioCache = new Map<string, HTMLAudioElement>();

// Check if URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Check if the URL is from the same origin
const isSameOrigin = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin === window.location.origin;
  } catch (e) {
    return false;
  }
};

/**
 * Preload an audio file and store it in cache
 * @param url URL of the audio file to preload
 * @returns A promise that resolves when the audio is loaded
 */
export const preloadAudio = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      if (!url) {
        reject(new Error('No audio URL provided'));
        return;
      }

      if (!isValidUrl(url)) {
        reject(new Error('Invalid audio URL'));
        return;
      }

      // Check if already in cache
      if (audioCache.has(url)) {
        resolve(audioCache.get(url)!);
        return;
      }

      // Create new audio element
      const audio = new Audio();
      
      // Add crossOrigin for external resources
      if (!isSameOrigin(url)) {
        audio.crossOrigin = "anonymous";
      }
      
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

      // Set a timeout to handle very slow or stuck loading
      const timeout = setTimeout(() => {
        if (!audioCache.has(url)) {
          console.warn(`Audio load timeout for ${url}`);
          reject(new Error('Audio loading timed out'));
        }
      }, 10000); // 10 seconds timeout

      // Clear timeout on success or error
      audio.addEventListener('canplaythrough', () => clearTimeout(timeout), { once: true });
      audio.addEventListener('error', () => clearTimeout(timeout), { once: true });
      
    } catch (error) {
      console.error('Error preloading audio:', error);
      reject(error);
    }
  });
};

/**
 * Create and use a temporary audio element that doesn't use caching
 * This can help with autoplay restrictions or cross-origin issues
 * @param url URL of the audio to play
 */
export const playOneTimeAudio = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      audio.src = url;
      
      const onEnded = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = (e: any) => {
        console.error('Error playing one-time audio:', e);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        reject(new Error(`Failed to play audio: ${e.message || 'Unknown error'}`));
      };
      
      audio.addEventListener('ended', onEnded, { once: true });
      audio.addEventListener('error', onError, { once: true });
      
      // Try to play with promise API
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Playback error:', error);
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
          reject(error);
        });
      }
    } catch (error) {
      console.error('Error in one-time audio playback:', error);
      reject(error);
    }
  });
};

/**
 * Try to play audio with Web Audio API as a fallback
 * This can sometimes work when regular HTML Audio element doesn't
 * @param url URL of the audio file
 */
export const playWithWebAudio = async (url: string): Promise<void> => {
  try {
    // Check if Web Audio API is supported
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error('Web Audio API not supported');
    }
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const context = new AudioContext();
    
    // Fetch the audio file
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    // Create a buffer source node
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    
    // Play the sound
    source.start(0);
    
    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error('Web Audio API playback failed:', error);
    throw error;
  }
};

/**
 * Play an audio notification with multiple fallback mechanisms
 * @param url URL of the audio file to play
 * @returns A promise that resolves when playback starts or rejects on error
 */
export const playNotificationSound = async (url: string): Promise<void> => {
  if (!url) {
    console.warn('No audio URL provided for notification');
    return;
  }
  
  try {
    // Try with cached audio first
    if (audioCache.has(url)) {
      const audio = audioCache.get(url)!;
      audio.currentTime = 0;
      await audio.play();
      return;
    }
    
    // If not cached, try preloading and playing
    try {
      const audio = await preloadAudio(url);
      audio.currentTime = 0;
      await audio.play();
      return;
    } catch (error: any) {
      // If preload/play failed, try one-time playback
      console.log('Standard audio playback failed, trying one-time playback:', error.message);
      try {
        await playOneTimeAudio(url);
        return;
      } catch (oneTimeError) {
        // If one-time playback failed, try Web Audio API
        console.log('One-time playback failed, trying Web Audio API:', oneTimeError);
        try {
          await playWithWebAudio(url);
          return;
        } catch (webAudioError) {
          // If all methods failed, throw the error
          console.error('All audio playback methods failed:', webAudioError);
          throw new Error('Failed to play notification sound using any method');
        }
      }
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
    throw error;
  }
};

/**
 * Test if audio can be played successfully
 * @param url URL of the audio file to test
 * @returns A promise that resolves when the test is successful or rejects on error
 */
export const testAudioPlayback = async (url: string): Promise<void> => {
  try {
    if (!url) {
      throw new Error('No audio URL provided');
    }
    
    if (!isValidUrl(url)) {
      throw new Error('Invalid audio URL format');
    }

    // Try all playback methods
    await playNotificationSound(url);
  } catch (error) {
    console.error('Audio test playback error:', error);
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
