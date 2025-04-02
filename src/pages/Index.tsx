
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = React.useState('');
  const [showControls, setShowControls] = React.useState(false);
  
  React.useEffect(() => {
    const fetchRestaurantInfo = async () => {
      const { data, error } = await supabase
        .from('restaurant_info')
        .select('name,description')
        .order('id', { ascending: true })
        .limit(1);
      
      if (data && data.length > 0) {
        setRestaurantName(data[0].name);
      }
    };
    fetchRestaurantInfo();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key === 'A') {
        navigate('/admin');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const handleCustomerClick = () => {
    navigate('/where-you-eat');
  };
  
  const handleWaiterClick = () => {
    navigate('/waiter-order');
  };
  
  const handleAdminClick = () => {
    navigate('/admin');
  };
  
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8f9fa]">
      {/* Hidden button at top-right corner to access admin */}
      <button 
        className="absolute top-0 right-0 w-16 h-16 opacity-0 z-50" 
        onClick={toggleControls}
        aria-label="Hidden admin button"
      />
      
      {showControls && (
        <motion.div 
          className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-40"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <button 
            onClick={handleAdminClick}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            Admin Panel
          </button>
        </motion.div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {restaurantName || 'Welcome to our Restaurant'}
        </motion.h1>
        
        <motion.div
          className="max-w-lg mb-12 text-lg text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>Please select how you'd like to order</p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={handleCustomerClick}
            className="bg-[#1a1f2c] hover:bg-[#2a2f3c] text-white rounded-xl p-8 shadow-lg transition-all hover:shadow-xl flex flex-col items-center"
          >
            <span className="text-5xl mb-4">🧑‍🤝‍🧑</span>
            <span className="text-2xl font-semibold">I'm a Customer</span>
            <span className="mt-2 text-gray-300">Order food for your table</span>
          </button>
          
          <button
            onClick={handleWaiterClick}
            className="bg-white hover:bg-gray-50 text-[#1a1f2c] border-2 border-[#1a1f2c] rounded-xl p-8 shadow-lg transition-all hover:shadow-xl flex flex-col items-center"
          >
            <span className="text-5xl mb-4">👨‍💼</span>
            <span className="text-2xl font-semibold">I'm a Waiter</span>
            <span className="mt-2 text-gray-600">Take orders for customers</span>
          </button>
        </motion.div>
      </div>
      
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} {restaurantName || 'Restaurant Name'} - All rights reserved</p>
        <p className="mt-1 text-xs">Press Ctrl+Shift+A for admin access</p>
      </div>
    </div>
  );
};

export default Index;
