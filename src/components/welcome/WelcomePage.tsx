
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import TableSelector from '../common/TableSelector';
import { useNavigate } from 'react-router-dom';

interface RestaurantInfoProps {
  name: string;
  description: string;
}

interface WelcomePageProps {
  restaurantInfo: RestaurantInfoProps | null;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ restaurantInfo }) => {
  const [showTableSelector, setShowTableSelector] = useState(false);
  const navigate = useNavigate();
  
  const handleTakeaway = () => {
    navigate('/menu', { state: { orderType: 'takeaway' } });
  };
  
  const handleEatIn = () => {
    setShowTableSelector(true);
  };
  
  const handleTableSelected = (tableNumber: number) => {
    navigate('/menu', { state: { orderType: 'eat-in', tableNumber } });
  };
  
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <AnimatePresence mode="wait">
        {!showTableSelector ? (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl mx-auto text-center px-6"
          >
            {/* Logo and branding */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <div className="w-40 h-40 rounded-full mx-auto mb-6 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-4xl font-bold">LOGO</span>
              </div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                {restaurantInfo?.name || 'Restaurant Name'}
              </h1>
              <p className="text-gray-500">
                {restaurantInfo?.description || 'Fresh, delicious food at your fingertips'}
              </p>
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-semibold mb-10 text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              How would you like to enjoy your meal today?
            </motion.h2>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                onClick={handleTakeaway}
                className="text-xl py-8 sm:min-w-[220px]"
              >
                Takeaway
              </Button>
              <Button 
                size="lg" 
                onClick={handleEatIn}
                className="text-xl py-8 sm:min-w-[220px]"
              >
                Eat In
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table-selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg mx-auto px-6"
          >
            <TableSelector 
              onSelectTable={handleTableSelected} 
              onCancel={() => setShowTableSelector(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomePage;
