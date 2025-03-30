
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index';
import MenuPage from './components/menu/MenuPage';
import OrderSummaryPage from './components/order/OrderSummaryPage';
import OrderConfirmation from './components/order/OrderConfirmation';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import MenuItems from './pages/admin/MenuItems';
import Categories from './pages/admin/Categories';
import Toppings from './pages/admin/Toppings';
import KitchenDisplay from './pages/admin/KitchenDisplay';
import Settings from './pages/admin/Settings';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/order-summary" element={<OrderSummaryPage />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/menu-items" element={<MenuItems />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/toppings" element={<Toppings />} />
          <Route path="/admin/kitchen-display" element={<KitchenDisplay />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
