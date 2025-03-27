
import React from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const isMobile = useIsMobile();
  
  return (
    <motion.div 
      className={`fixed inset-0 flex flex-col overflow-hidden bg-background pb-[100px] ${
        isMobile ? 'pt-safe px-safe' : ''
      } ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: '100dvh', // Always use dynamic viewport height for all devices
        width: '100%',
        maxHeight: '-webkit-fill-available', // Fix for some mobile browsers
      }}
    >
      {children}
    </motion.div>
  );
};

export default Layout;
