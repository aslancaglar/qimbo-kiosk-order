
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      // Check if the stored item is an empty string or null
      if (!item || item === 'null' || item === 'undefined') {
        return initialValue;
      }
      
      // Parse the stored value
      try {
        // Some JSON values might be wrapped in quotes (especially URLs)
        // Try to detect if this is a JSON string wrapped in another JSON string
        let parsedItem = JSON.parse(item);
        
        // If the parsed item is a string that looks like a JSON structure,
        // try to parse it again (happens sometimes with URLs)
        if (typeof parsedItem === 'string' && 
           (parsedItem.startsWith('{') || parsedItem.startsWith('[') || 
            parsedItem.startsWith('"'))) {
          try {
            const doubleParseResult = JSON.parse(parsedItem);
            return doubleParseResult as T;
          } catch {
            // If second parse fails, just use the first result
            return parsedItem as T;
          }
        }
        
        return parsedItem as T;
      } catch (parseError) {
        // If parsing fails, return the raw item as it might be a string value
        // that doesn't need parsing
        console.warn(`Error parsing localStorage key "${key}":`, parseError);
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readValue();
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          console.log(`Saved to localStorage: ${key} =`, valueToStore);
        } catch (stringifyError) {
          // If the value can't be stringified (e.g., circular references),
          // try to store it directly if it's a primitive type
          if (typeof valueToStore === 'string' || 
              typeof valueToStore === 'number' || 
              typeof valueToStore === 'boolean') {
            window.localStorage.setItem(key, String(valueToStore));
            console.log(`Saved primitive to localStorage: ${key} =`, valueToStore);
          } else {
            console.warn(`Couldn't stringify value for localStorage key "${key}":`, stringifyError);
          }
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== e.oldValue) {
        try {
          // If the new value is null, use the initial value
          if (e.newValue === null) {
            setStoredValue(initialValue);
            return;
          }
          
          // Try to parse the new value as JSON
          try {
            setStoredValue(JSON.parse(e.newValue) as T);
          } catch (parseError) {
            // If parsing fails, use the raw value
            setStoredValue(e.newValue as unknown as T);
          }
        } catch (error) {
          console.warn(`Error handling storage change for key "${key}":`, error);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
    return undefined;
  }, [key, initialValue]);

  return [storedValue, setValue];
}
