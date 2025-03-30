
/**
 * Utility for optimizing images to improve performance
 */

/**
 * Generates an optimized image URL with size parameters
 * @param url Original image URL
 * @param width Desired width
 * @param quality Image quality (1-100)
 * @returns Optimized image URL or fallback
 */
export const getOptimizedImageUrl = (
  url: string | null | undefined,
  width: number = 400,
  quality: number = 80
): string => {
  // Return placeholder for missing images
  if (!url) {
    return 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80';
  }

  // Handle images from Supabase Storage
  if (url.includes('supabase.co/storage/v1/object/public')) {
    // Add width and quality parameters if supported
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.append('width', width.toString());
      urlObj.searchParams.append('quality', quality.toString());
      return urlObj.toString();
    } catch (e) {
      console.error('Failed to parse image URL:', e);
      return url;
    }
  }

  // Handle Unsplash images
  if (url.includes('unsplash.com')) {
    try {
      const urlObj = new URL(url);
      // Update or add width & quality parameters
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      return urlObj.toString();
    } catch (e) {
      console.error('Failed to parse Unsplash URL:', e);
      return url;
    }
  }

  return url;
};

/**
 * Preloads important images to improve perceived performance
 * @param urls Array of image URLs to preload
 */
export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = getOptimizedImageUrl(url, 100); // Preload smaller versions
    }
  });
};

/**
 * Load images lazily with IntersectionObserver
 * @param imageRef Reference to image element
 * @param imageSrc Source URL of the image
 */
export const useLazyImage = (imageRef: React.RefObject<HTMLImageElement>, imageSrc: string): void => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && imageRef.current) {
          imageRef.current.src = getOptimizedImageUrl(imageSrc);
          observer.unobserve(imageRef.current);
        }
      });
    }, { rootMargin: '100px' });
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
  } else if (imageRef.current) {
    // Fallback for browsers without IntersectionObserver
    imageRef.current.src = getOptimizedImageUrl(imageSrc);
  }
};
