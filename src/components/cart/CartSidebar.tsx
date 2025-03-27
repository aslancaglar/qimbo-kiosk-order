import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import CartItem from './CartItem';
import { CartItemType } from './types';
import { ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemType[];
  onRemoveItem: (index: number) => void;
  onIncrementItem: (index: number) => void;
  onDecrementItem: (index: number) => void;
  orderType: 'takeaway' | 'eat-in';
  tableNumber?: number;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onIncrementItem,
  onDecrementItem,
  orderType,
  tableNumber,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
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
  
  const saveOrderToDatabase = async (orderData: any) => {
    try {
      console.log('Saving order to database with data:', JSON.stringify(orderData, null, 2));
      
      const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
      
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_type: orderData.orderType === 'eat-in' ? 'Table' : 'Takeaway',
          table_number: orderData.orderType === 'eat-in' ? orderData.tableNumber : null,
          items_count: orderData.items.reduce((sum: number, item: CartItemType) => sum + item.quantity, 0),
          total_amount: orderData.total,
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
      
      for (const item of orderData.items) {
        const { data: orderItemResult, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderResult.id,
            menu_item_id: item.product.id,
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
        
        console.log('Order item created successfully with ID:', orderItemResult.id);
        
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
      
      return orderResult.id;
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Error",
        description: "Could not save your order. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    try {
      const orderData = { 
        items, 
        orderType, 
        tableNumber,
        subtotal,
        tax,
        total
      };
      
      console.log('Starting checkout process with order data:', orderData);
      
      const orderId = await saveOrderToDatabase(orderData);
      console.log(`Order #${orderId} saved successfully to database`);
      
      navigate('/confirmation', { 
        state: { 
          ...orderData,
          orderId
        } 
      });
      
      toast({
        title: "Order Submitted",
        description: `Your order #${orderId} has been placed successfully!`,
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Could not complete checkout. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      {isOpen && (
        <div 
          className="fixed top-0 right-0 h-full w-[350px] bg-white shadow-lg z-50"
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Your Order</h2>
                {totalItems > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full px-2 py-0.5">
                    {totalItems}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {orderType === 'eat-in' && tableNumber && (
              <div className="px-6 py-3 bg-blue-50 flex items-center text-sm">
                <span className="font-medium text-blue-700">Table {tableNumber}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">Eat In</span>
              </div>
            )}
            
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some delicious items to get started</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 md:pb-[60px]">
                  <AnimatePresence initial={false}>
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.product.id}-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 border-b pb-4 last:border-0 last:pb-0"
                      >
                        <CartItem
                          item={item}
                          onRemove={() => onRemoveItem(index)}
                          onIncrement={() => onIncrementItem(index)}
                          onDecrement={() => onDecrementItem(index)}
                          isTablet={!isMobile && window.innerWidth < 1025}
                        />
                        
                        {item.selectedToppings && item.selectedToppings.length > 0 && (
                          <div className="pl-3 mt-2 space-y-1">
                            {item.selectedToppings.map((topping) => (
                              <div key={topping.id} className="flex justify-between text-sm text-gray-600">
                                <span>+ {topping.name}</span>
                                <span>${topping.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <div className="p-6 border-t border-gray-100">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span>${(items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2">
                      <span>Total</span>
                      <span>${(items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button size="full" onClick={handleCheckout} disabled={items.length === 0}>
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CartSidebar;
