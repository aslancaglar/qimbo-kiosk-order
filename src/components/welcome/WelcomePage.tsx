
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import TableSelector from '../common/TableSelector';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

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
  const { logo, primaryColor, accentColor } = useTheme();
  
  const handleTableSelectComplete = (tableNumber: number) => {
    // Store the table number in localStorage or context
    localStorage.setItem('tableNumber', String(tableNumber));
    
    // Navigate to the menu page
    navigate('/menu');
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {showTableSelector ? (
        <TableSelector onSelectTable={handleTableSelectComplete} onBack={() => setShowTableSelector(false)} />
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-12">
              <div className="w-40 h-40 rounded-full mx-auto mb-6 bg-primary flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img src={logo} alt="Restaurant Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground text-4xl font-bold">LOGO</span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                {restaurantInfo?.name || 'Restaurant Name'}
              </h1>
              <p className="text-gray-500">
                {restaurantInfo?.description || 'Fresh, delicious food at your fingertips'}
              </p>
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-xl font-semibold mb-6"
            >
              How would you like to order today?
            </motion.h2>
            
            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <Button 
                  onClick={() => setShowTableSelector(true)}
                  className="w-full py-6 text-lg"
                  variant="default"
                  style={{ backgroundColor: accentColor }}
                >
                  Dine In
                  <ArrowRight className="ml-2" />
                </Button>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Button 
                  onClick={() => navigate('/menu')} 
                  className="w-full py-6 text-lg"
                  variant="outline"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Takeaway
                  <ArrowRight className="ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
