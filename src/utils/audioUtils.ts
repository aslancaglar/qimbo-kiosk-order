
/**
 * Audio utilities for handling notification sounds
 */

// Audio context for better control and compatibility
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Cache for preloaded audio buffers and elements
const bufferCache: Record<string, AudioBuffer> = {};
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preloads an audio file to improve playback reliability
 * 
 * @param url URL of the audio file to preload (can be external or internal)
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
    
    // Handle CORS for external URLs
    audio.crossOrigin = "anonymous";
    
    // Set up event handlers
    audio.addEventListener('canplaythrough', () => {
      audioCache[url] = audio;
      resolve(audio);
    }, { once: true });
    
    audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e);
      reject(new Error(`Failed to load audio file from ${url}. Please check the URL.`));
    }, { once: true });
    
    // Start loading the audio file
    audio.src = url;
    audio.load();
  });
};

/**
 * Check if the URL is an absolute URL (external) or relative (internal)
 */
const isExternalUrl = (url: string): boolean => {
  return /^(https?:)?\/\//i.test(url);
};

/**
 * Plays a notification sound with fallbacks for browser compatibility
 * 
 * @param url URL of the audio file to play (can be external or internal)
 * @returns Promise that resolves when playback starts or rejects on error
 */
export const playNotificationSound = async (url: string): Promise<void> => {
  try {
    console.log(`Attempting to play sound from: ${url}`);
    
    // Try HTML5 Audio API first (works in most browsers)
    try {
      // Try to use cached or preloaded audio first
      const audio = await preloadAudio(url);
      
      // Reset audio if it was previously played
      audio.currentTime = 0;
      
      // Attempt to play the sound
      await audio.play();
      console.log('Notification sound played successfully using HTML5 Audio');
      return;
    } catch (audioError) {
      console.warn('HTML5 Audio playback failed, trying Web Audio API fallback:', audioError);
      
      // Fallback to Web Audio API
      try {
        const context = getAudioContext();
        
        let buffer: AudioBuffer;
        
        // Check cache first
        if (bufferCache[url]) {
          buffer = bufferCache[url];
        } else {
          // Fetch the audio file
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
          
          const arrayBuffer = await response.arrayBuffer();
          buffer = await context.decodeAudioData(arrayBuffer);
          bufferCache[url] = buffer;
        }
        
        // Create and play source
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
        console.log('Notification sound played successfully using Web Audio API');
        return;
      } catch (webAudioError) {
        console.error('Web Audio API fallback also failed:', webAudioError);
        throw new Error('Failed to play sound after trying multiple methods. Please check the URL and browser compatibility.');
      }
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    throw new Error('Failed to play sound. Please check the URL and try again.');
  }
};

/**
 * Checks if the provided URL is a valid audio file without attempting to play it
 * 
 * @param url URL to validate
 * @returns Promise that resolves if valid, rejects if invalid
 */
export const validateAudioUrl = async (url: string): Promise<boolean> => {
  try {
    // For external URLs, try to fetch headers
    if (isExternalUrl(url)) {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check content type if available
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('audio/')) {
        console.warn(`URL does not appear to be an audio file: ${contentType}`);
        // Continue anyway as some servers may not set proper Content-Type
      }
      
      return true;
    } else {
      // For internal URLs, just try to preload
      await preloadAudio(url);
      return true;
    }
  } catch (error) {
    console.error('Audio validation failed:', error);
    throw new Error('Invalid audio URL. Please enter a valid audio file URL.');
  }
};
