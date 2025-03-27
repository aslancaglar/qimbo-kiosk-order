import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../layout/Layout';
import CategorySelector from './CategorySelector';
import ProductCard, { Product } from './ProductCard';
import CartSidebar from '../cart/CartSidebar';
import { CartItemType, ToppingItem } from '../cart/types';
import Button from '../common/Button';
import { ShoppingBag, Home, Trash, Plus, Minus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import CancelOrderDialog from './CancelOrderDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface Category {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
}

const MenuPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderType, tableNumber } = location.state || {};
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isAndroidTablet, setIsAndroidTablet] = useState(false);
  
  useEffect(() => {
    const checkAndroidTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = userAgent.indexOf('android') > -1;
      const isTablet = window.innerWidth >= 600 && window.innerWidth <= 1200 && !isMobile;
      
      setIsAndroidTablet(isAndroid && isTablet);
    };
    
    checkAndroidTablet();
    window.addEventListener('resize', checkAndroidTablet);
    
    return () => {
      window.removeEventListener('resize', checkAndroidTablet);
    };
  }, [isMobile]);
  
  useEffect(() => {
    if (!orderType) {
      navigate('/');
    }
  }, [orderType, navigate]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_categories')
          .select('*')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu categories. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchCategories();
    
    const categoryChannel = supabase
      .channel('menu-category-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(categoryChannel);
    };
  }, [toast]);
  
  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*, menu_categories(name)')
          .eq('status', 'Active');
          
        if (error) {
          throw error;
        }
        
        const transformedProducts: Product[] = data.map(item => ({
          id: item.id.toString(),
          name: item.name,
          description: item.description || '',
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          category: item.category,
          hasToppings: item.has_toppings,
          availableToppingCategories: item.available_topping_categories || []
        }));
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu items. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMenuItems();
    
    const menuChannel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('Menu item change detected:', payload);
          fetchMenuItems();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(menuChannel);
    };
  }, [toast]);
  
  useEffect(() => {
    if (cartItems.length > 0 && !isCartOpen) {
      setIsCartOpen(true);
    }
  }, [cartItems, isCartOpen]);
  
  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(product => product.category === activeCategory);
  
  const handleProductSelect = (product: Product, selectedToppings?: ToppingItem[]) => {
    const newItem: CartItemType = {
      product,
      quantity: 1,
      selectedToppings
    };
    
    setCartItems([...cartItems, newItem]);
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
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
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

  const categoryNames = categories.map(cat => cat.name);
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <header className="flex justify-between items-center p-4 bg-red-600 text-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="rounded-full text-white hover:bg-red-700"
          >
            <Home size={24} />
          </Button>
          
          <h1 className="text-2xl font-bold">Menu</h1>
          
          <div className="w-10"></div>
        </header>
        
        <div className="flex flex-1 overflow-hidden bg-amber-50">
          <div className="w-20 md:w-24 bg-gradient-to-b from-yellow-400 to-yellow-500 overflow-y-auto">
            <CategorySelector 
              categories={categoryNames} 
              activeCategory={activeCategory} 
              onChange={setActiveCategory}
              orientation="vertical"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-red-700">PROMOTION</h2>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onSelect={handleProductSelect} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 text-lg">No items found in this category</p>
              </div>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {isCartOpen && (
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`bg-white border-t border-gray-200 shadow-lg ${isAndroidTablet ? 'mb-[200px]' : ''}`}
            >
              <div className={`p-4 ${isAndroidTablet ? 'pb-[200px]' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold">YOUR ORDER ({totalItems})</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCartOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Hide
                  </Button>
                </div>
                
                {cartItems.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto">
                    {cartItems.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="h-12 w-12 object-cover rounded mr-3" 
                          />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">${item.product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrementItem(index)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleIncrementItem(index)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 ml-2"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">TOTAL:</span>
                  <span className="font-bold text-xl">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelOrderClick}
                    className="bg-gray-200 hover:bg-gray-300 text-black"
                  >
                    Cancel Order
                  </Button>
                  <Button
                    onClick={handleConfirmOrder}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    CONFIRM ORDER
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <CancelOrderDialog 
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </Layout>
  );
};

export default MenuPage;
