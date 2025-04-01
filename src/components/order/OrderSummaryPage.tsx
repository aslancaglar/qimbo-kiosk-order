
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import Button from '../common/Button';
import { Check, ArrowLeft, Printer } from 'lucide-react';
import { CartItemType } from '../cart/types';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const OrderSummaryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items,
    orderType,
    tableNumber
  } = location.state || {};
  
  const { handleConfirmOrder, calculateSubtotal, calculateTax } = useCart({
    orderType,
    tableNumber
  });
  
  React.useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/', {
        replace: true
      });
    }
  }, [items, navigate]);
  
  // Calculate subtotal (pre-tax total)
  const subtotal = React.useMemo(() => {
    if (!items) return 0;
    
    return items.reduce((sum: number, item: CartItemType) => {
      let itemPrice = item.product.price * item.quantity;
      
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        const toppingsPrice = item.selectedToppings.reduce(
          (toppingSum, topping) => toppingSum + topping.price, 0
        );
        itemPrice += toppingsPrice * item.quantity;
      }
      
      return sum + itemPrice;
    }, 0);
  }, [items]);
  
  // Calculate tax based on each product's tax percentage
  const tax = React.useMemo(() => {
    if (!items) return 0;
    
    return items.reduce((taxTotal: number, item: CartItemType) => {
      let itemPrice = item.product.price * item.quantity;
      
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        const toppingsPrice = item.selectedToppings.reduce(
          (toppingSum, topping) => toppingSum + topping.price, 0
        );
        itemPrice += toppingsPrice * item.quantity;
      }
      
      const taxRate = item.taxPercentage || 10; // Default to 10% if not specified
      return taxTotal + (itemPrice * (taxRate / 100));
    }, 0);
  }, [items]);
  
  const total = subtotal + tax;
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleConfirmOrderClick = async () => {
    try {
      await handleConfirmOrder();
      const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();
      const {
        data: orderResult,
        error: orderError
      } = await supabase.from('orders').insert({
        customer_type: orderType === 'eat-in' ? 'Table' : 'Takeaway',
        table_number: orderType === 'eat-in' ? tableNumber : null,
        items_count: items.reduce((sum: number, item: CartItemType) => sum + item.quantity, 0),
        total_amount: total,
        status: 'New',
        order_number: orderNumber
      }).select('id, order_number').single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        toast({
          title: "Error",
          description: "Could not process your order. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Order created successfully:', orderResult);
      
      for (const item of items) {
        const {
          data: orderItemResult,
          error: orderItemError
        } = await supabase.from('order_items').insert({
          order_id: orderResult.id,
          menu_item_id: parseInt(item.product.id),
          quantity: item.quantity,
          price: item.product.price,
          notes: item.notes || null
        }).select('id').single();
        
        if (orderItemError) {
          console.error('Error creating order item:', orderItemError);
          continue;
        }
        
        if (item.selectedToppings && item.selectedToppings.length > 0) {
          for (const topping of item.selectedToppings) {
            const {
              error: toppingError
            } = await supabase.from('order_item_toppings').insert({
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
      
      navigate('/confirmation', {
        state: {
          items,
          orderType,
          tableNumber,
          subtotal,
          tax,
          total,
          orderId: orderResult.id,
          orderNumber: orderResult.order_number
        }
      });
    } catch (error) {
      console.error('Error during order confirmation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  return <Layout>
      <div className="h-full flex flex-col">
        <header className="flex justify-between items-center p-6 border-b border-gray-100">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          
          <h1 className="text-2xl font-semibold">Résumé de commande</h1>
          
          <div className="w-10"></div>
        </header>
        
        <motion.div className="flex-1 overflow-y-auto p-6 flex flex-col items-center" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.4
      }}>
          <div className="w-full max-w-2xl mx-auto">
            {orderType === 'eat-in' && tableNumber && <motion.div initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.2
          }} className="bg-blue-50 text-blue-800 font-medium rounded-md py-3 px-4 mb-6 flex items-center justify-center">
                Table #{tableNumber} • Sur place
              </motion.div>}
            
            <motion.div initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.3
          }} className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-lg mb-4">Articles commandés</h3>
                
                <div className="space-y-4">
                  {items && items.map((item: CartItemType, index: number) => {
                    // Calculate item price and tax
                    const itemBasePrice = item.product.price;
                    const toppingsPrice = item.selectedToppings?.reduce((sum, t) => sum + t.price, 0) || 0;
                    const itemPrice = (itemBasePrice + toppingsPrice) * item.quantity;
                    const taxPercent = item.taxPercentage || 10;
                    
                    return (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <span className="bg-gray-100 text-gray-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2">
                              {item.quantity}
                            </span>
                            <span className="font-medium">{item.product.name}</span>
                          </div>
                          <span className="font-medium">
                            {itemPrice.toFixed(2)} €
                            <span className="text-xs text-gray-500 ml-1">
                              (TVA: {taxPercent}%)
                            </span>
                          </span>
                        </div>
                        
                        {item.selectedToppings && item.selectedToppings.length > 0 && <div className="mt-1 pl-8">
                            {item.selectedToppings.map((topping, idx) => <div key={idx} className="flex justify-between text-sm text-gray-600">
                                <span>+ {topping.name}</span>
                                <span>{topping.price.toFixed(2)} €</span>
                              </div>)}
                          </div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>{tax.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.4
          }} className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-lg">
              <Button size="full" onClick={handleConfirmOrderClick} className="text-white text-lg py-4 bg-green-900 hover:bg-green-800">
                <Check className="w-5 h-5 mr-2" />
                Confirmer la commande
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>;
};

export default OrderSummaryPage;
