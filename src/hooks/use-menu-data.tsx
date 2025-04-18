
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/components/menu/ProductCard';

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
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 60000; // Cache for 1 minute

  const fetchCategories = useCallback(async (force = false) => {
    // Skip fetch if data is cached and not forced
    const now = Date.now();
    if (!force && categories.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      return;
    }

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
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu categories. Please try again.',
        variant: 'destructive',
      });
    }
  }, [categories.length, lastFetchTime, toast]);
  
  const fetchMenuItems = useCallback(async (force = false) => {
    // Skip fetch if data is cached and not forced
    const now = Date.now();
    if (!force && products.length > 0 && now - lastFetchTime < CACHE_DURATION) {
      setIsLoading(false);
      return;
    }

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
      setLastFetchTime(now);
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
  }, [products.length, lastFetchTime, toast]);
  
  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, [fetchCategories, fetchMenuItems]);
  
  // Subscribe to realtime updates with debounced refresh
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const categoryChannel = supabase
      .channel('menu-category-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        () => {
          // Debounce refresh to prevent multiple rapid updates
          clearTimeout(refreshTimeout);
          refreshTimeout = setTimeout(() => fetchCategories(true), 1000);
        }
      )
      .subscribe();
      
    const menuChannel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          // Debounce refresh to prevent multiple rapid updates
          clearTimeout(refreshTimeout);
          refreshTimeout = setTimeout(() => fetchMenuItems(true), 1000);
        }
      )
      .subscribe();
      
    return () => {
      clearTimeout(refreshTimeout);
      supabase.removeChannel(categoryChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [fetchCategories, fetchMenuItems]);

  return {
    products,
    categories,
    isLoading,
    categoryNames: categories.map(cat => cat.name),
    categoryIcons: categories.reduce((acc, cat) => {
      acc[cat.name] = cat.icon_url;
      return acc;
    }, {} as Record<string, string | null>),
    refreshData: useCallback(() => {
      fetchCategories(true);
      fetchMenuItems(true);
    }, [fetchCategories, fetchMenuItems])
  };
}
