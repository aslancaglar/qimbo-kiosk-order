
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import Button from '../common/Button';
import { Check, Clock, Home, Printer, Plus } from 'lucide-react';
import { CartItemType } from '../cart/types';

interface OrderConfirmationProps {}

const OrderConfirmation: React.FC<OrderConfirmationProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, orderType, tableNumber, subtotal, tax, total } = location.state || {};
  
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [printed, setPrinted] = useState(false);
  
  // Redirect to welcome page if no items are specified
  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);
  
  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto print on component mount and redirect after printing
  useEffect(() => {
    // Only print if we have items and haven't printed yet
    if (items && items.length > 0 && !printed) {
      // Delay printing by a small amount to ensure component is fully rendered
      const timer = setTimeout(() => {
        printOrder();
        setPrinted(true);
        
        // Redirect to welcome page after a brief delay
        setTimeout(() => {
          navigate('/');
        }, 500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [items, printed, navigate]);
  
  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Generate a random order number
  const orderNumber = Math.floor(10000 + Math.random() * 90000);

  // Print order function
  const printOrder = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const orderDate = new Date().toLocaleString();
    
    iframe.contentDocument?.write(`
      <html>
        <head>
          <title>Order #${orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            h1, h2 {
              text-align: center;
            }
            .order-details {
              margin-bottom: 20px;
            }
            .order-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .topping-item {
              display: flex;
              justify-content: space-between;
              margin-left: 20px;
              font-size: 0.9em;
              color: #666;
            }
            .divider {
              border-top: 1px dashed #ccc;
              margin: 15px 0;
            }
            .totals {
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .final-total {
              font-weight: bold;
              font-size: 1.2em;
              margin-top: 10px;
              border-top: 1px solid black;
              padding-top: 10px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 0.9em;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Order Receipt</h1>
          <div class="order-details">
            <p><strong>Order #:</strong> ${orderNumber}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Order Type:</strong> ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</p>
            ${orderType === 'eat-in' && tableNumber ? `<p><strong>Table #:</strong> ${tableNumber}</p>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <h2>Items</h2>
          ${items.map((item: CartItemType) => `
            <div class="order-item">
              <div>
                <span>${item.quantity} x ${item.product.name}</span>
                ${item.options && item.options.length > 0 ? 
                  `<br><small>${item.options.map((o: {name: string, value: string}) => o.value).join(', ')}</small>` : 
                  ''}
              </div>
              <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
            ${item.selectedToppings && item.selectedToppings.length > 0 ? 
              item.selectedToppings.map((topping: {id: number, name: string, price: number}) => `
                <div class="topping-item">
                  <span>+ ${topping.name}</span>
                  <span>$${topping.price.toFixed(2)}</span>
                </div>
              `).join('') : 
              ''}
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>$${tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="total-row final-total">
              <span>Total:</span>
              <span>$${total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your order!</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  document.body.innerHTML = 'Printing complete.';
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    iframe.contentDocument?.close();
    
    // Remove the iframe after printing
    setTimeout(() => {
      iframe.remove();
    }, 2000);
  };
  
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
                Printing your receipt and redirecting you...
              </motion.p>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-card p-6 mb-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Estimated Wait Time</h3>
                  <p className="text-2xl font-bold">{formatTime(countdown)}</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <motion.div 
                  className="bg-amber-500 h-2 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${(1 - countdown / 300) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">
                {Math.round((1 - countdown / 300) * 100)}% complete
              </p>
            </motion.div>
            
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
