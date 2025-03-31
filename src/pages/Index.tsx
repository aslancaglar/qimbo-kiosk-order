
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from '@/components/ui/carousel';
import Layout from '../components/layout/Layout';

// Food images for the slideshow
const foodImages = [
  "/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png", // Uploaded burger image
  "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", // Salad
  "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", // Pizza
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", // Burger
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", // Pasta
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % foodImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleButtonClick = () => {
    navigate('/whereyoueat');
  };
  
  return (
    <motion.div 
      className="h-screen w-screen flex flex-col relative bg-amber-100 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="absolute top-4 right-4 z-10">
        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
          <span className="text-primary font-bold text-xs text-center">DUMMY<br/>LOGO</span>
        </div>
      </div>
      
      {/* Background slideshow */}
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
              src={foodImages[currentIndex]} 
              alt="Food" 
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
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
        
        {/* Indicator dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pb-2">
          {foodImages.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Index;
