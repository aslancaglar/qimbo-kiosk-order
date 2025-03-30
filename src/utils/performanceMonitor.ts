
/**
 * Simple performance monitoring utilities
 */

// Store timing marks
const marks: Record<string, number[]> = {};
const PERFORMANCE_ENABLED = process.env.NODE_ENV !== 'production';
const MEMORY_WARNING_THRESHOLD = 3 * 1024 * 1024 * 1024; // 3GB (high for Raspberry Pi)

/**
 * Start timing a specific operation
 * @param markName Name of the operation to time
 */
export const startMeasure = (markName: string): void => {
  if (!PERFORMANCE_ENABLED) return;
  
  if (!marks[markName]) {
    marks[markName] = [];
  }
  marks[markName].push(performance.now());
  
  // Log memory usage if available (Chrome only)
  if (window.performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usedHeapSizeMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
    const totalHeapSizeMB = Math.round(memory.totalJSHeapSize / (1024 * 1024));
    
    console.log(`[Memory] ${markName} start: ${usedHeapSizeMB}MB / ${totalHeapSizeMB}MB`);
    
    // Warn if memory usage is high
    if (memory.usedJSHeapSize > MEMORY_WARNING_THRESHOLD) {
      console.warn(`⚠️ High memory usage: ${usedHeapSizeMB}MB`);
    }
  }
};

/**
 * End timing a specific operation and log the duration
 * @param markName Name of the operation to end timing
 */
export const endMeasure = (markName: string): number | null => {
  if (!PERFORMANCE_ENABLED) return null;
  
  if (!marks[markName] || marks[markName].length === 0) {
    console.warn(`No start mark found for: ${markName}`);
    return null;
  }
  
  const startTime = marks[markName].pop() as number;
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`[Perf] ${markName}: ${duration.toFixed(2)}ms`);
  
  // Log memory usage if available (Chrome only)
  if (window.performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usedHeapSizeMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
    const totalHeapSizeMB = Math.round(memory.totalJSHeapSize / (1024 * 1024));
    
    console.log(`[Memory] ${markName} end: ${usedHeapSizeMB}MB / ${totalHeapSizeMB}MB`);
  }
  
  return duration;
};

/**
 * Clear all performance marks
 */
export const clearMeasures = (): void => {
  Object.keys(marks).forEach(key => {
    delete marks[key];
  });
};

/**
 * Create a debounced function that limits how often a function can be called
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Create a throttled function that limits how often a function can be called
 * @param func The function to throttle
 * @param limit Limit in milliseconds
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};
