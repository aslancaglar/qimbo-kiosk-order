
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MenuPage from "./components/menu/MenuPage";
import OrderConfirmation from "./components/order/OrderConfirmation";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import MenuItems from "./pages/admin/MenuItems";
import Categories from "./pages/admin/Categories";
import Toppings from "./pages/admin/Toppings";
import Settings from "./pages/admin/Settings";
import KitchenDisplay from "./pages/admin/KitchenDisplay";

// Add framer-motion for animations
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { enableRealtimeForTables } from "./utils/enableRealtimeForTables";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds
    },
  },
});

const App = () => {
  // Initialize realtime subscriptions when the app starts
  useEffect(() => {
    console.log('Initializing realtime subscriptions...');
    
    const initializeRealtime = async () => {
      try {
        const channels = await enableRealtimeForTables();
        console.log('Realtime subscriptions initialized successfully', channels);
        
        // We don't unsubscribe from these channels as we want them to persist
        // throughout the application lifecycle
      } catch (error) {
        console.error('Failed to initialize realtime:', error);
      }
    };
    
    initializeRealtime();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Customer-facing routes */}
              <Route path="/" element={<Index />} />
              <Route path="/menu" element={<MenuPage />} />
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
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
