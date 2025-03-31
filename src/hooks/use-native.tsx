
import { useEffect, useState } from 'react';

export function useIsNative() {
  const [isNative, setIsNative] = useState(false);
  
  useEffect(() => {
    // Check if the app is running in a native Capacitor container
    const checkIfNative = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return (
        // Check for Capacitor
        window.hasOwnProperty('Capacitor') ||
        // Check for common native app indicators
        userAgent.includes('android') ||
        userAgent.includes('ios')
      );
    };
    
    setIsNative(checkIfNative());
  }, []);
  
  return isNative;
}
