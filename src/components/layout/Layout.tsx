
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Check if app is running in standalone mode (added to home screen)
    const isInStandaloneMode = () => 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode());
    
    // Listen for changes (useful when app is launched from home screen later)
    const mql = window.matchMedia('(display-mode: standalone)');
    const listener = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  return (
    <motion.div 
      className={`h-screen w-screen flex flex-col overflow-auto ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isStandalone && (
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center">
            <h1 className="text-lg font-medium">Qimbo Kiosk</h1>
            <div className="w-10"></div> {/* Empty div to maintain layout balance */}
          </div>
        </div>
      )}
      {children}
      <div className="md:h-[60px] bg-red-600 w-full" />
    </motion.div>
  );
};

export default Layout;
