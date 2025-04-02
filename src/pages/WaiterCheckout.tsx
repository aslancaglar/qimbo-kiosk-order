
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Trash2 } from 'lucide-react';
import { CartItemType } from '@/components/cart/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWaiterCart } from '@/hooks/use-waiter-cart';

const WaiterCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, orderType, tableNumber, waiterOrder } = location.state || {};
  const { clearCart } = useWaiterCart();
  
  React.useEffect(() => {
    if (!items || items.length === 0 || !waiterOrder) {
      navigate('/waiter-order', { replace: true });
    }
  }, [items, navigate, waiterOrder]);
  
  const total = items?.reduce((sum: number, item: CartItemType) => {
    let itemTotal = item.product.price * item.quantity;
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      const toppingsPrice = item.selectedToppings.reduce(
        (toppingSum, topping) => toppingSum + topping.price, 0
      );
      itemTotal += toppingsPrice * item.quantity;
    }
    return sum + itemTotal;
  }, 0) || 0;
  
  const taxRate = 0.1;
  const taxAmount = total - (total / (1 + taxRate));
  const subtotal = total - taxAmount;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleConfirmOrder = async () => {
    try {
      const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
      
      // Create the order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_type: 'Table',
          table_number: tableNumber,
          items_count: items.reduce((sum: number, item: CartItemType) => sum + item.quantity, 0),
          total_amount: total,
          status: 'New',
          order_number: orderNumber
        })
        .select('id')
        .single();
        
      if (orderError) {
        console.error('Error creating order:', orderError);
        toast({
          title: "Error",
          description: "Could not process the order. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Order created successfully:', orderResult);
      
      // Create order items
      for (const item of items) {
        const { data: orderItemResult, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderResult.id,
            menu_item_id: parseInt(item.product.id),
            quantity: item.quantity,
            price: item.product.price,
            notes: item.notes || null
          })
          .select('id')
          .single();
          
        if (orderItemError) {
          console.error('Error creating order item:', orderItemError);
          continue;
        }
        
        // Create order item toppings if any
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          for (const topping of item.selectedToppings) {
            const { error: toppingError } = await supabase
              .from('order_item_toppings')
              .insert({
                order_item_id: orderItemResult.id,
                topping_id: topping.id,
                price: topping.price
              });
              
            if (toppingError) {
              console.error('Error creating order item topping:', toppingError);
              continue;
            }
          }
        }
      }
      
      // Clear the cart
      clearCart();
      
      // Show success message
      toast({
        title: "Order Placed",
        description: `Order #${orderNumber} has been sent to the kitchen`,
      });
      
      // Navigate back to the waiter order page
      navigate('/waiter-order', { 
        state: { 
          orderSuccess: true,
          orderNumber,
          tableNumber
        } 
      });
    } catch (error) {
      console.error('Error during order confirmation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <header className="flex justify-between items-center p-6 border-b bg-white">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          
          <h1 className="text-2xl font-semibold">Order Confirmation</h1>
          
          <div className="w-10"></div>
        </header>
        
        <motion.div 
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-2xl mx-auto">
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.2 }} 
              className="bg-blue-50 text-blue-800 font-medium rounded-md py-3 px-4 mb-6 flex items-center justify-center"
            >
              Table #{tableNumber} • Waiter Order
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.3 }} 
              className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                
                <div className="space-y-4">
                  {items?.map((item: CartItemType, index: number) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.product.name}</span>
                        </div>
                        <span className="font-medium">
                          €{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="mt-1 pl-8">
                          {item.selectedToppings.map((topping, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-600">
                              <span>+ {topping.name}</span>
                              <span>€{topping.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span>€{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.4 }} 
              className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3"
            >
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handleGoBack}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Edit
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => navigate('/waiter-order')}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Cancel Order
              </Button>
              <Button 
                onClick={handleConfirmOrder} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirm Order
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default WaiterCheckout;
