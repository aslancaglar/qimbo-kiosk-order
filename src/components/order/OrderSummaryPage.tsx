
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import Button from '../common/Button';
import { Check, ArrowLeft, Printer } from 'lucide-react';
import { CartItemType } from '../cart/types';
import { useCart } from '@/hooks/use-cart';

const OrderSummaryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, orderType, tableNumber } = location.state || {};
  const { handleConfirmOrder } = useCart({ orderType, tableNumber });
  
  // Redirect to welcome page if no items are specified
  React.useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/', { replace: true });
    }
  }, [items, navigate]);
  
  // Calculate subtotal including toppings
  const subtotal = items?.reduce((sum: number, item: CartItemType) => {
    let itemTotal = item.product.price * item.quantity;
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      const toppingsPrice = item.selectedToppings.reduce(
        (toppingSum, topping) => toppingSum + topping.price, 0
      );
      itemTotal += toppingsPrice * item.quantity;
    }
    return sum + itemTotal;
  }, 0) || 0;
  
  const tax = subtotal * 0.1; // 10% tax rate
  const total = subtotal + tax;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleConfirmOrderClick = async () => {
    // First confirm the order using the cart handler
    await handleConfirmOrder();
    
    // Then navigate to the confirmation page with all the necessary order data
    navigate('/confirmation', { 
      state: { 
        items,
        orderType,
        tableNumber,
        subtotal,
        tax,
        total
      } 
    });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <header className="flex justify-between items-center p-6 border-b border-gray-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleGoBack}
            className="rounded-full"
          >
            <ArrowLeft size={24} />
          </Button>
          
          <h1 className="text-2xl font-semibold">Order Summary</h1>
          
          <div className="w-10"></div> {/* Empty space for alignment */}
        </header>
        
        <motion.div 
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-2xl mx-auto">
            {orderType === 'eat-in' && tableNumber && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 text-blue-800 font-medium rounded-md py-3 px-4 mb-6 flex items-center justify-center"
              >
                Table #{tableNumber} • Eat In
              </motion.div>
            )}
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                
                <div className="space-y-4">
                  {items && items.map((item: CartItemType, index: number) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.product.name}</span>
                        </div>
                        <span className="font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Display selected toppings */}
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="mt-1 pl-8">
                          {item.selectedToppings.map((topping, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-600">
                              <span>+ {topping.name}</span>
                              <span>${topping.price.toFixed(2)}</span>
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
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 shadow-lg"
            >
              <Button 
                size="full" 
                onClick={handleConfirmOrderClick}
                className="bg-primary hover:bg-primary/90 text-white text-lg py-4"
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

export default OrderSummaryPage;
