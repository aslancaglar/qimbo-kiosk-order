
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CartSidebar from '../cart/CartSidebar';

const MenuPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderType, tableNumber } = location.state || {};
  const isMobile = useIsMobile();
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  
  // Custom hooks for data fetching and cart management
  const { products, isLoading, categoryNames, categoryIcons } = useMenuData();
  const [activeCategory, setActiveCategory] = useState(categoryNames?.length > 0 ? categoryNames[0] : '');
  
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
  
  // Update active category when categories are loaded
  useEffect(() => {
    if (categoryNames?.length > 0 && !activeCategory) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames, activeCategory]);
  
  // Redirect if no orderType is provided
  useEffect(() => {
    if (!orderType) {
      navigate('/');
    }
  }, [orderType, navigate]);

  // Toggle cart sheet
  const toggleCartSheet = () => {
    setIsCartSheetOpen(!isCartSheetOpen);
  };
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <MenuHeader 
          showCartIcon={isMobile}
          cartItemsCount={cartItems.length}
          onCartClick={toggleCartSheet}
        />
        
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
          {isCartOpen && !isMobile && (
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
        
        {/* Mobile Cart Sheet */}
        <Sheet open={isMobile && isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
          <SheetContent side="right" className="p-0">
            <CartSidebar
              isOpen={true}
              onClose={() => setIsCartSheetOpen(false)}
              items={cartItems}
              onRemoveItem={handleRemoveItem}
              onIncrementItem={handleIncrementItem}
              onDecrementItem={handleDecrementItem}
              orderType={orderType}
              tableNumber={tableNumber}
            />
          </SheetContent>
        </Sheet>
        
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
