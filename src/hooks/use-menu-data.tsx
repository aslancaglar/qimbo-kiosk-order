
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/components/menu/types/productTypes';

interface Category {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  icon_url: string | null;
}

export function useMenuData() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return {
    products,
    categories,
    isLoading,
    categoryNames: categories.map(cat => cat.name),
    categoryIcons: categories.reduce((acc, cat) => {
      acc[cat.name] = cat.icon_url;
      return acc;
    }, {} as Record<string, string | null>)
  };
}
