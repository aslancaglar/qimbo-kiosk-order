
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
      className={`fixed inset-0 flex flex-col overflow-hidden bg-background ${
        isMobile ? 'pb-safe' : ''
      } ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        height: isMobile ? 'calc(100dvh)' : '100vh', // Use dynamic viewport height on mobile
        width: '100%',
      }}
    >
      {children}
    </motion.div>
  );
};

export default Layout;
