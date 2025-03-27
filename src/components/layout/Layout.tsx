
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const isMobile = useIsMobile();
  const [isAndroidTablet, setIsAndroidTablet] = useState(false);
  
  useEffect(() => {
    // Detect Android tablets
    const checkAndroidTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = userAgent.indexOf('android') > -1;
      const isTablet = window.innerWidth >= 600 && window.innerWidth <= 1200 && !isMobile;
      
      setIsAndroidTablet(isAndroid && isTablet);
    };
    
    checkAndroidTablet();
    window.addEventListener('resize', checkAndroidTablet);
    
    return () => {
      window.removeEventListener('resize', checkAndroidTablet);
    };
  }, [isMobile]);

  return (
    <motion.div 
      className={`h-screen w-screen flex flex-col overflow-hidden bg-background ${isAndroidTablet ? 'pb-[100px]' : ''} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '100vh',
        maxHeight: '-webkit-fill-available',
      }}
    >
      {children}
    </motion.div>
  );
};

export default Layout;
