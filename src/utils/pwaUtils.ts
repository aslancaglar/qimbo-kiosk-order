
/**
 * PWA installation and update utilities
 */

// Check if the app is installed (in standalone mode)
export const isPwaInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (navigator as any).standalone === true;
};

// Check if the app can be installed
export const isPwaInstallable = async (): Promise<boolean> => {
  if ('BeforeInstallPromptEvent' in window) {
    return true;
  }

  // For iOS devices
  const isIos = /iphone|ipad|ipod/.test(
    window.navigator.userAgent.toLowerCase()
  );
  const isInStandaloneMode = isPwaInstalled();
  
  return isIos && !isInStandaloneMode;
};

// Stored install prompt event
let deferredPrompt: any = null;

// Listen for beforeinstallprompt event
export const registerInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
  });
};

// Show the install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }
  
  try {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt
    deferredPrompt = null;
    
    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
};

// Register the service worker
export const registerPwaServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('PWA service worker registered:', registration);
    } catch (error) {
      console.error('PWA service worker registration failed:', error);
    }
  }
};

// Check for service worker updates
export const checkForPwaUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error('Error checking for PWA updates:', error);
      return false;
    }
  }
  return false;
};
