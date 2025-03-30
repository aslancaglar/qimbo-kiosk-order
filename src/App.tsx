import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import MenuPage from './components/menu/MenuPage';
import OrderSummaryPage from './components/order/OrderSummaryPage';
import OrderConfirmation from './components/order/OrderConfirmation';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import KitchenDisplay from './pages/admin/KitchenDisplay';
import MenuItems from './pages/admin/MenuItems';
import Categories from './pages/admin/Categories';
import Toppings from './pages/admin/Toppings';
import Settings from './pages/admin/Settings';
import PrintSettings from './pages/admin/PrintSettings';

const App = () => {
  const [queryClient] = useState(() => new QueryClient());
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /admin if the user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token && window.location.pathname === '/') {
      navigate('/admin');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/menu/:categoryId?" element={<MenuPage />} />
            <Route path="/order-summary" element={<OrderSummaryPage />} />
            <Route path="/confirmation" element={<OrderConfirmation />} />
            <Route path="/admin" element={<React.Suspense fallback={<div>Loading...</div>}><Dashboard /></React.Suspense>} />
            <Route path="/admin/orders" element={<React.Suspense fallback={<div>Loading...</div>}><Orders /></React.Suspense>} />
            <Route path="/admin/kitchen" element={<React.Suspense fallback={<div>Loading...</div>}><KitchenDisplay /></React.Suspense>} />
            <Route path="/admin/menu-items" element={<React.Suspense fallback={<div>Loading...</div>}><MenuItems /></React.Suspense>} />
            <Route path="/admin/categories" element={<React.Suspense fallback={<div>Loading...</div>}><Categories /></React.Suspense>} />
            <Route path="/admin/toppings" element={<React.Suspense fallback={<div>Loading...</div>}><Toppings /></React.Suspense>} />
            <Route path="/admin/print-settings" element={<React.Suspense fallback={<div>Loading...</div>}><PrintSettings /></React.Suspense>} />
            <Route path="/admin/settings" element={<React.Suspense fallback={<div>Loading...</div>}><Settings /></React.Suspense>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
