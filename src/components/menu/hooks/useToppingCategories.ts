
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ToppingCategory, Topping } from "../types/toppingTypes";
import { Product } from "../types/productTypes";

export const useToppingCategories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const { toast } = useToast();

  const fetchToppingCategories = async (product: Product) => {
    if (!product.availableToppingCategories || product.availableToppingCategories.length === 0) {
      return;
    }
    
    setIsLoading(true);
    try {      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('topping_categories')
        .select('*')
        .in('id', product.availableToppingCategories)
        .order('display_order', { ascending: true })
        .order('name');
      
      if (categoriesError) throw categoriesError;
      
      const toppingPromises = categoriesData.map(async category => {
        const { data: toppingsData, error: toppingsError } = await supabase
          .from('toppings')
          .select('*')
          .eq('category_id', category.id)
          .eq('available', true)
          .order('display_order', { ascending: true })
          .order('name');
        
        if (toppingsError) throw toppingsError;
        
        return {
          id: category.id,
          name: category.name,
          minSelection: category.min_selection,
          maxSelection: category.max_selection,
          required: category.required,
          toppings: toppingsData.map(topping => ({
            id: topping.id,
            name: topping.name,
            price: topping.price,
            categoryId: topping.category_id,
            maxQuantity: topping.max_quantity
          }))
        };
      });
      
      const categories = await Promise.all(toppingPromises);
      setToppingCategories(categories);
      
      return categories;
    } catch (error) {
      console.error('Error fetching toppings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load toppings. Please try again.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    toppingCategories,
    fetchToppingCategories
  };
};
