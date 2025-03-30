import React, { useState, useEffect } from 'react';
import MenuHeader from './MenuHeader';
import MenuContent from './MenuContent';
import CartSidebar from '../cart/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { Product, ToppingItem } from './ProductCard';
import { useMenuData } from '@/hooks/use-menu-data';

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ToppingItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const handleProductSelect = (product: Product, selectedToppings?: ToppingItem[]) => {
    setSelectedProduct(product);
    setSelectedToppings(selectedToppings || []);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (product: Product, quantity: number, selectedToppings?: ToppingItem[]) => {
    if (product) {
      useCart().addToCart({
        ...product,
        quantity,
        selectedToppings
      });
      setIsProductModalOpen(false);
    }
  };

  const handleUpdateCartItem = (item: any, quantity: number) => {
    useCart().updateCartItem(item, quantity);
  };

  const handleRemoveItem = (item: any) => {
    useCart().removeFromCart(item);
  };

  const handleClearCart = () => {
    useCart().clearCart();
  };

  const handlePlaceOrder = () => {
    // Implement order placement logic here
    console.log('Order placed!');
    useCart().clearCart();
  };

  // Fetch menu data from hooks
  const { products, categories, isLoading, categoryNames, categoryIcons } = useMenuData();
  const { cart, isCartOpen, toggleCart, addToCart, removeFromCart, updateCartItem, cartSubtotal } = useCart();
  
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
          onClose={toggleCart}
          cartItems={cart}
          onRemoveItem={handleRemoveItem}
          onUpdateItem={handleUpdateItem}
          onClearCart={handleClearCart}
          onPlaceOrder={handlePlaceOrder}
          subtotal={cartSubtotal}
        />
      </div>
    </div>
  );
};

export default MenuPage;
