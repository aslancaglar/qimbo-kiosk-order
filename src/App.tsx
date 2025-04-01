
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WelcomePage from './components/welcome/WelcomePage';
import WhereYouEat from './pages/WhereYouEat';
import MenuPage from './components/menu/MenuPage';
import OrderSummaryPage from './components/order/OrderSummaryPage';
import OrderConfirmation from './components/order/OrderConfirmation';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import KitchenDisplay from './pages/admin/KitchenDisplay';
import Categories from './pages/admin/Categories';
import MenuItems from './pages/admin/MenuItems';
import Toppings from './pages/admin/Toppings';
import Settings from './pages/admin/Settings';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Export settings types for use in other components
export interface AppSettings {
  printSettings?: {
    enabled: boolean;
    apiKey?: string;
    printerId?: number;
  };
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<WhereYouEat />} />
          <Route path="/where-you-eat" element={<WhereYouEat />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/summary" element={<OrderSummaryPage />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
          <Route path="/admin" element={<AdminLayout><Outlet /></AdminLayout>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="kitchen-display" element={<KitchenDisplay />} />
            <Route path="categories" element={<Categories />} />
            <Route path="menu-items" element={<MenuItems />} />
            <Route path="toppings" element={<Toppings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
