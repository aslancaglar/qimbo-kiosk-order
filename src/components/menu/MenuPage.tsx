
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../layout/Layout';
import CancelOrderDialog from './CancelOrderDialog';
import MenuHeader from './MenuHeader';
import MenuContent from './MenuContent';
import CartSummary from './CartSummary';
import { useMenuData } from '@/hooks/use-menu-data';
import { useCart } from '@/hooks/use-cart';
import { ToppingItem } from '../cart/types';

const MenuPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderType, tableNumber } = location.state || {};
  const [activeCategory, setActiveCategory] = useState('All');

  // Custom hooks for data fetching and cart management
  const { products, isLoading, categoryNames, categoryIcons } = useMenuData();
  const { 
    cartItems,
    isCartOpen,
    showCancelDialog,
    setShowCancelDialog,
    handleProductSelect,
    handleRemoveItem,
    handleIncrementItem,
    handleDecrementItem,
    handleCancelOrderClick,
    handleConfirmCancel,
    handleConfirmOrder
  } = useCart({ orderType, tableNumber });
  
  // Redirect if no orderType is provided
  useEffect(() => {
    if (!orderType) {
      navigate('/');
    }
  }, [orderType, navigate]);
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <MenuHeader title="Menu" />
        
        <MenuContent 
          products={products}
          categories={categoryNames}
          categoryIcons={categoryIcons}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          isLoading={isLoading}
          onProductSelect={handleProductSelect}
        />
        
        <AnimatePresence>
          {isCartOpen && (
            <CartSummary 
              cartItems={cartItems}
              onRemoveItem={handleRemoveItem}
              onIncrementItem={handleIncrementItem}
              onDecrementItem={handleDecrementItem}
              onCancelOrderClick={handleCancelOrderClick}
              onConfirmOrder={handleConfirmOrder}
              orderType={orderType}
              tableNumber={tableNumber}
            />
          )}
        </AnimatePresence>
        
        <CancelOrderDialog 
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </Layout>
  );
};

export default MenuPage;
