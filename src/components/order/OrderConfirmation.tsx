
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import Button from '../common/Button';
import { Check, Home, Printer, Plus } from 'lucide-react';
import { CartItemType } from '../cart/types';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { printOrder } from '@/utils/printUtils';

interface OrderConfirmationProps {}

const OrderConfirmation: React.FC<OrderConfirmationProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { items, orderType, tableNumber, subtotal, tax, total, orderId, orderNumber } = location.state || {};
  
  const [printed, setPrinted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  // Redirect to welcome page if no items are specified
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/', { replace: true });
    }
  }, [items, navigate]);
  
  // Add a new effect for the 6-second redirect
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      setRedirecting(true);
      navigate('/', { replace: true });
    }, 6000); // 6 seconds
    
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  // Auto print on component mount
  useEffect(() => {
    // Only print if we have items and haven't printed yet
    if (items && items.length > 0 && !printed) {
      // Delay printing by a small amount to ensure component is fully rendered
      const timer = setTimeout(() => {
        handlePrintOrder();
        setPrinted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [items, printed]);
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: language === 'fr' ? 'EUR' : 'USD',
    }).format(amount);
  };

  // Print order function
  const handlePrintOrder = () => {
    try {
      printOrder(
        orderNumber || orderId,
        items,
        orderType,
        tableNumber,
        subtotal,
        tax,
        total
      );
    } catch (error) {
      console.error('Error printing order:', error);
      toast({
        title: t.common.error,
        description: t.orders.failedToPrintReceipt,
        variant: "destructive",
      });
    }
  };
  
  // If we're redirecting, show nothing to avoid flash of content
  if (redirecting) {
    return null;
  }
  
  return (
    <Layout>
      <div className="h-full flex flex-col">
        <header className="flex justify-between items-center p-6 border-b border-gray-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <Home size={24} />
          </Button>
          
          <h1 className="text-2xl font-semibold">{t.orders.orderConfirmation}</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrintOrder}
            className="rounded-full"
            title={t.orders.printReceipt}
          >
            <Printer size={24} />
          </Button>
        </header>
        
        <motion.div 
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="h-10 w-10 text-green-600" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl font-bold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {t.orders.thankYou}
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t.orders.orderPlaced.replace('{orderNumber}', orderNumber || orderId)}
              </motion.p>
              
              {orderType === 'eat-in' && tableNumber && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 text-blue-800 font-medium rounded-md py-2 px-4 inline-block mt-2"
                >
                  {t.orders.tableNumber} #{tableNumber}
                </motion.div>
              )}
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-500 mt-4"
              >
                {t.orders.printingReceipt}
              </motion.p>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-gray-500 mt-2"
              >
                {t.orders.redirectingToHomePage}
              </motion.p>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-card overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-lg mb-4">{t.orders.orderSummary}</h3>
                
                <div className="space-y-4">
                  {items && items.map((item: CartItemType, index: number) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity} x {item.product.name}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <p className="text-sm text-gray-500">
                            {item.options.map(o => o.value).join(', ')}
                          </p>
                        )}
                        
                        {/* Display selected toppings */}
                        {item.selectedToppings && item.selectedToppings.length > 0 && (
                          <div className="mt-1">
                            {item.selectedToppings.map((topping, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Plus size={12} className="mr-1 text-gray-400" />
                                  {topping.name}
                                </span>
                                <span>{formatCurrency(topping.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.cart.subtotal}</span>
                    <span>{formatCurrency(subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.cart.tax}</span>
                    <span>{formatCurrency(tax || 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200 mt-2">
                    <span>{t.cart.total}</span>
                    <span>{formatCurrency(total || 0)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/')}
                className="min-w-[200px]"
              >
                {t.orders.placeNewOrder}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
