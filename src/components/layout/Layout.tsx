
import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <motion.div 
      className={`h-screen w-screen flex flex-col overflow-hidden bg-background pb-[100px] ${className}`}
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
