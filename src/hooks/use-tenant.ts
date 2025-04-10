
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useTenant() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get restaurant ID from localStorage
    const storedRestaurantId = localStorage.getItem('restaurantId');
    setRestaurantId(storedRestaurantId);
    setIsSetupComplete(!!storedRestaurantId);
    
    // Check if we need to redirect to setup
    const isSetupPage = window.location.pathname === '/setup';
    if (!storedRestaurantId && !isSetupPage) {
      // No restaurant ID and not on setup page, redirect to setup
      navigate('/setup', { replace: true });
    }
  }, [navigate]);
  
  const setTenant = (id: string) => {
    localStorage.setItem('restaurantId', id);
    setRestaurantId(id);
    setIsSetupComplete(true);
    // Reload the page to ensure all components use the new tenant
    window.location.reload();
  };
  
  const clearTenant = () => {
    localStorage.removeItem('restaurantId');
    setRestaurantId(null);
    setIsSetupComplete(false);
    navigate('/setup', { replace: true });
  };
  
  return {
    restaurantId,
    isSetupComplete,
    setTenant,
    clearTenant
  };
}

export default useTenant;
