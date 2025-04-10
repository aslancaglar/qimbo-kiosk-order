
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import TableSelector from '../common/TableSelector';
import { useNavigate } from 'react-router-dom';
import { supabase, withRestaurantId } from '../../integrations/supabase/client';
import { getRestaurantContext } from '../../middleware/tenant';

interface RestaurantInfoProps {
  name: string;
  description: string;
}

interface WelcomePageProps {
  restaurantInfo: RestaurantInfoProps | null;
}

interface OrderingSettings {
  requireTableSelection: boolean;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ restaurantInfo }) => {
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [orderingSettings, setOrderingSettings] = useState<OrderingSettings>({
    requireTableSelection: true
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const navigate = useNavigate();
  
  // Fetch ordering settings and logo when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Get the restaurant context
        const restaurantContext = getRestaurantContext();
        setRestaurantName(restaurantContext.name);
        
        // Fetch ordering settings
        const { data: orderData, error: orderError } = await withRestaurantId(
          supabase
            .from('settings')
            .select('*')
            .eq('key', 'ordering_settings')
        ).maybeSingle();

        if (orderError) {
          console.error('Error fetching ordering settings:', orderError);
        } else if (orderData && orderData.value) {
          const settings = orderData.value as Record<string, any>;
          setOrderingSettings({
            requireTableSelection: settings.requireTableSelection !== undefined 
              ? !!settings.requireTableSelection 
              : true
          });
        }
        
        // Fetch logo
        const { data: appearanceData, error: appearanceError } = await withRestaurantId(
          supabase
            .from('settings')
            .select('value')
            .eq('key', 'appearance_settings')
        ).maybeSingle();
          
        if (appearanceError) {
          console.error('Error fetching appearance settings:', appearanceError);
        } else if (appearanceData && appearanceData.value) {
          const settings = appearanceData.value as Record<string, any>;
          if (settings.logo) {
            console.log('Logo URL found:', settings.logo);
            setLogoUrl(settings.logo);
            // Preload the logo image
            const img = new Image();
            img.onload = () => setLogoLoaded(true);
            img.onerror = () => {
              console.error('Failed to load logo image');
              setLogoLoaded(false);
            };
            img.src = settings.logo;
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);
  
  const handleTakeaway = () => {
    navigate('/menu', { state: { orderType: 'takeaway' } });
  };
  
  const handleEatIn = () => {
    // If table selection is not required, go directly to menu
    if (!orderingSettings.requireTableSelection) {
      navigate('/menu', { state: { orderType: 'eat-in' } });
    } else {
      setShowTableSelector(true);
    }
  };
  
  const handleTableSelected = (tableNumber: number) => {
    navigate('/menu', { state: { orderType: 'eat-in', tableNumber } });
  };
  
  // Default logo if none is provided from settings
  const defaultLogoUrl = '/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png';
  
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
              <div className="w-40 h-40 rounded-full mx-auto mb-6 bg-white/80 flex items-center justify-center overflow-hidden shadow-lg">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Restaurant Logo" 
                    className="w-32 h-32 object-contain" 
                    onError={(e) => {
                      console.error('Logo image failed to load, using default');
                      (e.target as HTMLImageElement).src = defaultLogoUrl;
                    }} 
                  />
                ) : (
                  <img 
                    src={defaultLogoUrl} 
                    alt="Default Logo" 
                    className="w-32 h-32 object-contain" 
                  />
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                {restaurantName || restaurantInfo?.name || 'Nom du Restaurant'}
              </h1>
            </motion.div>
            
            <motion.h2 
              className="text-3xl font-semibold mb-10 text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Comment souhaitez-vous déguster votre repas aujourd'hui ?
            </motion.h2>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                onClick={handleTakeaway}
                className="text-xl py-8 sm:min-w-[220px]"
              >
                À emporter
              </Button>
              <Button 
                size="lg" 
                onClick={handleEatIn}
                className="text-xl py-8 sm:min-w-[220px]"
              >
                Sur place
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
