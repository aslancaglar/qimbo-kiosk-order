
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/toast';
import Index from './pages/Index';
import WaiterOrder from './pages/WaiterOrder';
import WaiterCheckout from './pages/WaiterCheckout';
import WhereYouEat from './pages/WhereYouEat';
import MenuPage from './components/menu/MenuPage';
import OrderSummaryPage from './components/order/OrderSummaryPage';
import OrderConfirmation from './components/order/OrderConfirmation';
import NotFound from './pages/NotFound';

// Admin Routes
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import MenuItems from './pages/admin/MenuItems';
import Categories from './pages/admin/Categories';
import Toppings from './pages/admin/Toppings';
import Settings from './pages/admin/Settings';
import KitchenDisplay from './pages/admin/KitchenDisplay';

// Welcome Route
import WelcomePage from './components/welcome/WelcomePage';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/where-you-eat" element={<WhereYouEat />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/order-summary" element={<OrderSummaryPage />} />
          <Route path="/confirmation" element={<OrderConfirmation />} />
          
          {/* Waiter routes */}
          <Route path="/waiter-order" element={<WaiterOrder />} />
          <Route path="/waiter-checkout" element={<WaiterCheckout />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/menu-items" element={<MenuItems />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/toppings" element={<Toppings />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/kitchen" element={<KitchenDisplay />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </ToastProvider>
  );
}

export default App;
