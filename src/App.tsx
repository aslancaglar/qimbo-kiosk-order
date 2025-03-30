import React, { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { enableRealtimeForTables } from "./utils/enableRealtimeForTables";
import { startMeasure, endMeasure } from "./utils/performanceMonitor";

// Lazily import the Index page
const Index = lazy(() => import("./pages/Index"));

// Lazy load other pages to reduce initial bundle size
const NotFound = lazy(() => import("./pages/NotFound"));
const MenuPage = lazy(() => import("./components/menu/MenuPage"));
const OrderConfirmation = lazy(() => import("./components/order/OrderConfirmation"));
const OrderSummaryPage = lazy(() => import("./components/order/OrderSummaryPage"));

// Lazy load admin pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const MenuItems = lazy(() => import("./pages/admin/MenuItems"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Toppings = lazy(() => import("./pages/admin/Toppings"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const KitchenDisplay = lazy(() => import("./pages/admin/KitchenDisplay"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
);

// Performance optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      gcTime: 300000,
      retry: 1,
    },
  },
});

// RouteChangeTracker component to measure page load performance
const RouteChangeTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    startMeasure(`Page load: ${location.pathname}`);
    
    // End measure after component mounts
    const timeout = setTimeout(() => {
      endMeasure(`Page load: ${location.pathname}`);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [location.pathname]);
  
  return null;
};

// AppContent component ensures hooks are called in the right context
const AppContent = () => {
  // Initialize performance monitoring
  useEffect(() => {
    startMeasure('App initialization');
    
    console.log('Initializing app with performance monitoring...');
    
    // Initialize realtime subscriptions when the app starts
    const initializeRealtime = async () => {
      try {
        startMeasure('Realtime initialization');
        const channels = await enableRealtimeForTables();
        endMeasure('Realtime initialization');
        console.log('Realtime subscriptions initialized successfully', channels);
      } catch (error) {
        console.error('Failed to initialize realtime:', error);
      }
    };
    
    initializeRealtime();
    
    // End initial measure
    const timeout = setTimeout(() => {
      endMeasure('App initialization');
    }, 500);
    
    // Clean up
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <BrowserRouter>
      <RouteChangeTracker />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Customer-facing routes */}
            <Route path="/" element={<Index />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/order-summary" element={<OrderSummaryPage />} />
            <Route path="/confirmation" element={<OrderConfirmation />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/menu" element={<MenuItems />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/toppings" element={<Toppings />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/kitchen" element={<KitchenDisplay />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      
      {/* UI Components */}
      <Toaster />
      <Sonner />
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
