
import { Route, Routes, Navigate } from 'react-router-dom';
import Setup from './pages/Setup';
import Index from './pages/Index';

export const SetupRoutes = () => {
  // Check if setup has been completed
  const isSetupComplete = localStorage.getItem('restaurantId') !== null;
  
  return (
    <Routes>
      <Route path="/setup" element={<Setup />} />
      <Route path="/*" element={isSetupComplete ? <Index /> : <Navigate to="/setup" replace />} />
    </Routes>
  );
};

export default SetupRoutes;
