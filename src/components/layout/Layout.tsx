
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkIfTablet = () => {
      const width = window.innerWidth;
      // Typical tablet width range
      return width >= 600 && width <= 1024;
    };
    
    setIsTablet(checkIfTablet());
    
    const handleResize = () => {
      setIsTablet(checkIfTablet());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div 
      className={`h-screen w-screen flex flex-col overflow-hidden bg-background ${isTablet ? 'pb-[100px]' : ''} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default Layout;
