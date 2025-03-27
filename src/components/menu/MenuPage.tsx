
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import CategorySelector from './CategorySelector';
import ProductCard, { Product } from './ProductCard';
import CartSidebar from '../cart/CartSidebar';
import { CartItemType, ToppingItem } from '../cart/types';
import Button from '../common/Button';
import { ShoppingBag, Home } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

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
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Convert database categories to format expected by CategorySelector
  const categoryNames = categories.map(cat => cat.name);
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <header className="flex justify-between items-center p-6 border-b border-gray-100">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <Home size={24} />
          </Button>
          
          <h1 className="text-2xl font-semibold">Menu</h1>
          
          <div className="w-10"></div>
        </header>
        
        <CategorySelector 
          categories={categoryNames} 
          activeCategory={activeCategory} 
          onChange={setActiveCategory} 
        />
        
        <div className="flex-1 overflow-y-auto p-6 pr-[350px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        
        <CartSidebar 
          isOpen={isCartOpen} 
          onClose={() => {}} 
          items={cartItems} 
          onRemoveItem={handleRemoveItem}
          onIncrementItem={handleIncrementItem}
          onDecrementItem={handleDecrementItem}
          orderType={orderType}
          tableNumber={tableNumber}
        />
      </div>
    </Layout>
  );
};

export default MenuPage;
