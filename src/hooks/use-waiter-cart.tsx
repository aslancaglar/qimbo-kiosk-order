import { useState, useEffect } from 'react';
import { CartItemType } from '@/components/cart/types';
import { Product } from '@/components/menu/ProductCard';

export function useWaiterCart() {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);

  // Try to load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('waiterCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('waiterCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  const addItemToCart = (product: Product, quantity = 1, notes?: string) => {
    const existingItemIndex = cartItems.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex !== -1) {
      // If item already exists, update quantity
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      
      // Update notes if provided
      if (notes) {
        updatedItems[existingItemIndex].notes = notes;
      }
      
      setCartItems(updatedItems);
    } else {
      // Otherwise add new item
      const newItem: CartItemType = {
        product,
        quantity,
        notes
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const removeItemFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const incrementItemQuantity = (index: number) => {
    const newItems = [...cartItems];
    newItems[index].quantity += 1;
    setCartItems(newItems);
  };

  const decrementItemQuantity = (index: number) => {
    const newItems = [...cartItems];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity -= 1;
      setCartItems(newItems);
    } else {
      removeItemFromCart(index);
    }
  };

  const updateItemNotes = (index: number, notes: string) => {
    const newItems = [...cartItems];
    newItems[index].notes = notes;
    setCartItems(newItems);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('waiterCart');
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const isCartEmpty = () => {
    return cartItems.length === 0;
  };

  return {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
    updateItemNotes,
    clearCart,
    getTotalAmount,
    getItemCount,
    isCartEmpty
  };
}
