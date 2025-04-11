
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '../integrations/supabase/client';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const fetchAppearanceSettings = async () => {
      try {
        setLoading(true);
        const {
          data,
          error
        } = await supabase.from('settings').select('value').eq('key', 'appearance_settings').maybeSingle();
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
            console.log('Logo URL found:', settings.logo);
            setLogoUrl(settings.logo);
            const img = new Image();
            img.onload = () => setLogoLoaded(true);
            img.onerror = () => {
              console.error('Failed to load logo image');
              setLogoLoaded(false);
            };
            img.src = settings.logo;
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

  useEffect(() => {
    if (customImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % customImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [customImages]);

  const handleButtonClick = () => {
    navigate('/whereyoueat');
  };

  return <motion.div className="h-screen w-screen flex flex-col relative bg-black overflow-hidden" initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5
  }}>
      <div className="absolute top-6 right-6 z-10">
        {logoUrl && (
          <div className="w-32 h-32 rounded-full bg-white/80 flex items-center justify-center overflow-hidden shadow-lg">
            <img 
              src={logoUrl} 
              alt="Restaurant Logo" 
              className="w-26 h-26 object-contain" 
              onError={(e) => {
                console.error('Logo image failed to load');
                // Remove the broken image instead of showing a fallback
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
        )}
      </div>
      
      {customImages.length > 0 && <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 1
        }} className="h-full w-full flex items-center justify-center">
              <img src={getOptimizedImageUrl(customImages[currentIndex], 1200, 85)} alt="Food" className="h-full w-full object-cover object-center opacity-70" />
            </motion.div>
          </AnimatePresence>
        </div>}
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-grow" />
        
        <div className="w-full px-6 pb-12">
          <motion.button onClick={handleButtonClick} className="w-full bg-white rounded-lg py-4 px-6 text-center font-bold text-black shadow-lg" whileTap={{
          scale: 0.98
        }} whileHover={{
          scale: 1.02
        }}>
            <div className="flex items-center justify-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12.5L11 15.5L16 9.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="black" strokeWidth="2" />
              </svg>
              <span className="font-bebas font-extrabold tracking-wider text-2xl">TOUCHEZ POUR COMMANDER</span>
            </div>
          </motion.button>
        </div>
        
        {customImages.length > 0 && <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pb-2">
            {customImages.map((_, index) => <div key={index} className={`w-2 h-2 rounded-full ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`} />)}
          </div>}
      </div>
    </motion.div>;
};

export default Index;
