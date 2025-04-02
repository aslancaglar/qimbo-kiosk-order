
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from '@/components/ui/carousel';
import Layout from '../components/layout/Layout';
import { supabase } from '../integrations/supabase/client';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Fetch appearance settings from database
  useEffect(() => {
    const fetchAppearanceSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'appearance_settings')
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching appearance settings:', error);
          return;
        }

        if (data && data.value) {
          const settings = data.value as Record<string, any>;
          if (settings.slideshowImages && Array.isArray(settings.slideshowImages) && settings.slideshowImages.length > 0) {
            setCustomImages(settings.slideshowImages);
          }
          if (settings.logo) {
            setLogoUrl(settings.logo);
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppearanceSettings();
  }, []);
  
  // Auto-advance slideshow only if we have custom images
  useEffect(() => {
    if (customImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % customImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [customImages]);
  
  const handleButtonClick = () => {
    navigate('/whereyoueat');
  };
  
  return (
    <motion.div 
      className="h-screen w-screen flex flex-col relative bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="absolute top-4 right-4 z-10">
        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Restaurant Logo" 
              className="w-12 h-12 object-contain"
            />
          ) : (
            <span className="text-primary font-bold text-xs text-center">DUMMY<br/>LOGO</span>
          )}
        </div>
      </div>
      
      {/* Background slideshow - only shown if custom images exist */}
      {customImages.length > 0 && (
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="h-full w-full flex items-center justify-center"
            >
              <img 
                src={getOptimizedImageUrl(customImages[currentIndex], 1200, 85)} 
                alt="Food" 
                className="h-full w-full object-cover object-center opacity-70" 
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Spacer to push content to bottom */}
        <div className="flex-grow" />
        
        {/* Button container */}
        <div className="w-full px-6 pb-12">
          <motion.button
            onClick={handleButtonClick}
            className="w-full bg-white rounded-lg py-4 px-6 text-center font-bold text-black shadow-lg"
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12.5L11 15.5L16 9.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="black" strokeWidth="2"/>
              </svg>
              <span>TAP TO SELECT THE ITEMS</span>
            </div>
          </motion.button>
        </div>
        
        {/* Indicator dots - only shown if custom images exist */}
        {customImages.length > 0 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pb-2">
            {customImages.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Index;
