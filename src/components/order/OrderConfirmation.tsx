
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import Button from '../common/Button';
import { Check, Home, Printer, Plus } from 'lucide-react';
import { CartItemType } from '../cart/types';
import { toast } from '@/components/ui/use-toast';
import { printOrderBrowser, printOrderViaBizPrint } from '../../utils/printUtils';
import { BizPrintConfig } from '../../utils/bizPrint';
import { supabase } from '../../integrations/supabase/client';

interface OrderConfirmationProps {}

const OrderConfirmation: React.FC<OrderConfirmationProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, orderType, tableNumber, subtotal, tax, total, orderId } = location.state || {};
  
  const [printed, setPrinted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [bizPrintSettings, setBizPrintSettings] = useState<BizPrintConfig | null>(null);
  
  // Fetch BizPrint settings
  useEffect(() => {
    const fetchBizPrintSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'bizprint_settings')
          .maybeSingle();

        if (error) {
          console.error('Error fetching BizPrint settings:', error);
          return;
        }

        if (data && data.value) {
          const settings = data.value as Record<string, any>;
          setBizPrintSettings({
            api_key: settings.api_key || '',
            api_endpoint: settings.api_endpoint || 'https://api.getbizprint.com/v1',
            enabled: !!settings.enabled,
            default_printer_id: settings.default_printer_id || '',
            auto_print: settings.auto_print !== undefined ? !!settings.auto_print : true
          });
        }
      } catch (error) {
        console.error('Unexpected error fetching BizPrint settings:', error);
      }
    };

    fetchBizPrintSettings();
  }, []);
  
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
        printOrder();
        setPrinted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [items, printed, bizPrintSettings]);
  
  // Use the order ID as the order number
  const orderNumber = orderId;

  // Print order function
  const printOrder = async () => {
    try {
      // Check if BizPrint is enabled and we have settings
      if (bizPrintSettings && bizPrintSettings.enabled && bizPrintSettings.auto_print) {
        console.log('Printing via BizPrint...');
        const success = await printOrderViaBizPrint(
          bizPrintSettings,
          orderNumber,
          items,
          orderType,
          tableNumber,
          subtotal,
          tax,
          total
        );
        
        if (success) {
          toast({
            title: "Success",
            description: "Receipt sent to printer",
          });
          return;
        }
      } else {
        // Fallback to browser printing
        printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
      }
    } catch (error) {
      console.error('Error printing order:', error);
      toast({
        title: "Error",
        description: "Failed to print order receipt",
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
          
          <h1 className="text-2xl font-semibold">Order Confirmation</h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={printOrder}
            className="rounded-full"
            title="Print receipt"
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
                Thank You!
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Your order #{orderNumber} has been placed
              </motion.p>
              
              {orderType === 'eat-in' && tableNumber && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 text-blue-800 font-medium rounded-md py-2 px-4 inline-block mt-2"
                >
                  Table #{tableNumber}
                </motion.div>
              )}
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-500 mt-4"
              >
                Printing your receipt...
              </motion.p>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-gray-500 mt-2"
              >
                Redirecting to home page in a few seconds...
              </motion.p>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-card overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
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
                                <span>${topping.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-medium">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>${tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>${total?.toFixed(2) || '0.00'}</span>
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
                Place New Order
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
