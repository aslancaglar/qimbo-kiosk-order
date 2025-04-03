
import { useState, useEffect, useRef } from 'react';
import { CartItemType, ToppingItem } from '@/components/cart/types';
import { Product } from '@/components/menu/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface UseCartOptions {
  orderType: 'takeaway' | 'eat-in';
  tableNumber?: number;
}

// Storage key for cart items
const CART_STORAGE_KEY = 'restaurant_cart_items';
const ORDER_TYPE_STORAGE_KEY = 'restaurant_order_type';
const TABLE_NUMBER_STORAGE_KEY = 'restaurant_table_number';

export function useCart({ orderType, tableNumber }: UseCartOptions) {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Add a ref to track if an order is being processed
  const orderBeingProcessed = useRef<boolean>(false);

  // Load cart items from localStorage on initial render
  useEffect(() => {
    try {
      // Load saved cart items
      const savedCartItems = localStorage.getItem(CART_STORAGE_KEY);
      const savedOrderType = localStorage.getItem(ORDER_TYPE_STORAGE_KEY) as 'takeaway' | 'eat-in' | null;
      const savedTableNumber = localStorage.getItem(TABLE_NUMBER_STORAGE_KEY);

      // Check if saved order type matches current order type
      const isOrderTypeMatch = savedOrderType === orderType;
      const isTableNumberMatch = orderType === 'eat-in' 
        ? savedTableNumber === String(tableNumber)
        : true;

      if (savedCartItems && isOrderTypeMatch && isTableNumberMatch) {
        const parsedItems = JSON.parse(savedCartItems);
        setCartItems(parsedItems);
        if (parsedItems.length > 0) {
          setIsCartOpen(true);
        }
      } else {
        // Clear storage if order type or table number changed
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(ORDER_TYPE_STORAGE_KEY);
        localStorage.removeItem(TABLE_NUMBER_STORAGE_KEY);
      }

      // Save current order type and table number
      localStorage.setItem(ORDER_TYPE_STORAGE_KEY, orderType);
      if (orderType === 'eat-in' && tableNumber) {
        localStorage.setItem(TABLE_NUMBER_STORAGE_KEY, String(tableNumber));
      } else {
        localStorage.removeItem(TABLE_NUMBER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [orderType, tableNumber]);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length > 0 && !isCartOpen) {
      setIsCartOpen(true);
    }
  }, [cartItems, isCartOpen]);

  const handleProductSelect = (product: Product, selectedToppings?: ToppingItem[]) => {
    const existingItemIndex = cartItems.findIndex(item => {
      if (item.product.id !== product.id) return false;
      
      if (!selectedToppings && !item.selectedToppings) return true;
      
      if (!selectedToppings || !item.selectedToppings) return false;
      
      if (selectedToppings.length !== item.selectedToppings.length) return false;
      
      return selectedToppings.every(topping => 
        item.selectedToppings?.some(itemTopping => 
          itemTopping.id === topping.id
        )
      );
    });
    
    if (existingItemIndex !== -1) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
      
      toast({
        title: "Item Updated",
        description: `${product.name} quantity increased`,
      });
    } else {
      const newItem: CartItemType = {
        product,
        quantity: 1,
        selectedToppings
      };
      setCartItems([...cartItems, newItem]);
      
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your order`,
      });
    }
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    
    if (newItems.length === 0) {
      setIsCartOpen(false);
    }
  };
  
  const handleIncrementItem = (index: number) => {
    const newItems = [...cartItems];
    newItems[index].quantity += 1;
    setCartItems(newItems);
  };
  
  const handleDecrementItem = (index: number) => {
    const newItems = [...cartItems];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity -= 1;
      setCartItems(newItems);
    }
  };
  
  const handleCancelOrderClick = () => {
    setShowCancelDialog(true);
  };
  
  const handleConfirmCancel = () => {
    setCartItems([]);
    setIsCartOpen(false);
    setShowCancelDialog(false);
    
    // Clear cart from localStorage
    localStorage.removeItem(CART_STORAGE_KEY);
    
    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled",
    });
  };
  
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return;
    
    // Prevent duplicate order creation with multiple safeguards
    if (isProcessingOrder || orderBeingProcessed.current) {
      console.log('Order already being processed, preventing duplicate order');
      return;
    }
    
    // Set the processing flags
    setIsProcessingOrder(true);
    orderBeingProcessed.current = true;
    
    try {
      console.log('Starting order confirmation process, preventing duplicates...');
      
      const total = cartItems.reduce((sum, item) => {
        let itemTotal = item.product.price * item.quantity;
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          const toppingsPrice = item.selectedToppings.reduce(
            (toppingSum, topping) => toppingSum + topping.price, 0
          );
          itemTotal += toppingsPrice * item.quantity;
        }
        return sum + itemTotal;
      }, 0);
      
      const taxRate = 0.1;
      const taxAmount = total - (total / (1 + taxRate));
      const subtotal = total - taxAmount;
      
      const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
      console.log('Generated order number:', orderNumber);
      
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_type: orderType === 'eat-in' ? 'Table' : 'Takeaway',
          table_number: orderType === 'eat-in' ? tableNumber : null,
          items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: total,
          status: 'New',
          order_number: orderNumber
        })
        .select('id')
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }
      
      console.log('Order created successfully with ID:', orderResult.id);
      
      for (const item of cartItems) {
        const { data: orderItemResult, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderResult.id,
            menu_item_id: parseInt(item.product.id),
            quantity: item.quantity,
            price: item.product.price,
            notes: item.notes || null,
          })
          .select('id')
          .single();
        
        if (orderItemError) {
          console.error('Error creating order item:', orderItemError);
          continue;
        }
        
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          for (const topping of item.selectedToppings) {
            const { error: toppingError } = await supabase
              .from('order_item_toppings')
              .insert({
                order_item_id: orderItemResult.id,
                topping_id: topping.id,
                price: topping.price,
              });
            
            if (toppingError) {
              console.error('Error creating order item topping:', toppingError);
              continue;
            }
          }
        }
      }
      
      // Navigate to confirmation page
      navigate('/confirmation', { 
        state: { 
          items: cartItems,
          orderType,
          tableNumber,
          subtotal,
          taxAmount,
          total,
          orderId: orderResult.id,
          orderNumber
        },
        replace: true // Use replace to prevent back navigation to the order summary
      });
      
      toast({
        title: "Order Submitted",
        description: `Your order #${orderNumber} has been placed successfully!`,
      });
      
      // Clear cart
      setCartItems([]);
      setIsCartOpen(false);
      
      // Clear cart from localStorage after successful order
      localStorage.removeItem(CART_STORAGE_KEY);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Could not complete checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear the processing flags
      setIsProcessingOrder(false);
      orderBeingProcessed.current = false;
    }
  };

  return {
    cartItems,
    isCartOpen,
    showCancelDialog,
    isProcessingOrder,
    setShowCancelDialog,
    handleProductSelect,
    handleRemoveItem,
    handleIncrementItem,
    handleDecrementItem,
    handleCancelOrderClick,
    handleConfirmCancel,
    handleConfirmOrder
  };
}
