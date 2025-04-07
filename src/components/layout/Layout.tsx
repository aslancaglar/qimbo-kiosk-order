
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const location = useLocation();
  
  // Check if current route is menu or order-summary
  const hideFooter = location.pathname === '/menu' || location.pathname === '/order-summary' || location.pathname === '/confirmation';
  
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
      {children}
      {!hideFooter && <div className="md:h-[60px] bg-red-600 w-full" />}
    </motion.div>
  );
};

export default Layout;
