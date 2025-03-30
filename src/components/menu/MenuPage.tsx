
import React, { useState } from 'react';
import MenuHeader from './MenuHeader';
import MenuContent from './MenuContent';
import CartSidebar from '../cart/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { Product } from './ProductCard';
import { ToppingItem } from '../cart/types';
import { useMenuData } from '@/hooks/use-menu-data';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ToppingItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // Initialize useCart with required orderType
  const { 
    cartItems, 
    isCartOpen, 
    handleProductSelect, 
    handleRemoveItem,
    handleIncrementItem,
    handleDecrementItem,
    handleCancelOrderClick,
    handleConfirmOrder
  } = useCart({ orderType: 'eat-in', tableNumber: 1 });

  // Fetch menu data from hooks
  const { products, categories, isLoading, categoryNames, categoryIcons } = useMenuData();
  
  return (
    <div className="flex flex-col h-[calc(100vh-170px)] overflow-hidden">
      <MenuHeader />
      <div className="flex flex-1 overflow-hidden">
        <MenuContent 
          products={products}
          categories={categoryNames}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          isLoading={isLoading}
          onProductSelect={handleProductSelect}
          categoryIcons={categoryIcons}
        />
        <CartSidebar 
          isOpen={isCartOpen}
          onClose={() => {}}
          items={cartItems}
          onRemoveItem={handleRemoveItem}
          onIncrementItem={handleIncrementItem}
          onDecrementItem={handleDecrementItem}
          orderType="eat-in"
          tableNumber={1}
        />
      </div>
    </div>
  );
};

export default MenuPage;
