
import { useState } from 'react';
import { Product } from '@/components/menu/ProductCard';
import { ToppingItem } from '@/components/cart/types';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from './use-toast';

interface ToppingCategory {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  required: boolean;
  toppings: Topping[];
}

interface Topping {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  maxQuantity: number;
}

export function useProductSelection(
  onSelectComplete: (product: Product, selectedToppings?: ToppingItem[]) => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const { toast } = useToast();

  const openProductSelection = async (product: Product) => {
    if (!product.hasToppings || !product.availableToppingCategories || product.availableToppingCategories.length === 0) {
      // If no toppings, directly select the product
      onSelectComplete(product);
      return;
    }

    setCurrentProduct(product);
    await fetchToppingCategories(product);
    setIsSelectionOpen(true);
  };

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
    } catch (error) {
      console.error('Error fetching toppings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load toppings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSelectionOpen,
    setIsSelectionOpen,
    isLoading,
    toppingCategories,
    currentProduct,
    openProductSelection,
    closeProductSelection: () => {
      setIsSelectionOpen(false);
      setCurrentProduct(null);
    },
    completeSelection: (selectedToppings?: ToppingItem[]) => {
      if (currentProduct) {
        onSelectComplete(currentProduct, selectedToppings);
      }
      setIsSelectionOpen(false);
      setCurrentProduct(null);
    }
  };
}
