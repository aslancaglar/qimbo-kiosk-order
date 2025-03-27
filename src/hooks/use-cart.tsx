
import { useState, useEffect } from 'react';
import { CartItemType, ToppingItem } from '@/components/cart/types';
import { Product } from '@/components/menu/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

interface UseCartOptions {
  orderType: 'takeaway' | 'eat-in';
  tableNumber?: number;
}

export function useCart({ orderType, tableNumber }: UseCartOptions) {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    } else {
      const newItem: CartItemType = {
        product,
        quantity: 1,
        selectedToppings
      };
      setCartItems([...cartItems, newItem]);
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
    
    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled",
    });
  };
  
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const subtotal = cartItems.reduce((sum, item) => {
        let itemTotal = item.product.price * item.quantity;
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          const toppingsPrice = item.selectedToppings.reduce(
            (toppingSum, topping) => toppingSum + topping.price, 0
          );
          itemTotal += toppingsPrice * item.quantity;
        }
        return sum + itemTotal;
      }, 0);
      
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      
      const orderData = { 
        items: cartItems, 
        orderType, 
        tableNumber,
        subtotal,
        tax,
        total
      };
      
      console.log('Starting checkout process with order data:', orderData);
      
      const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
      
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
      
      navigate('/confirmation', { 
        state: { 
          ...orderData,
          orderId: orderResult.id
        } 
      });
      
      toast({
        title: "Order Submitted",
        description: `Your order #${orderResult.id} has been placed successfully!`,
      });
      
      setCartItems([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Could not complete checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
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
  };
}
