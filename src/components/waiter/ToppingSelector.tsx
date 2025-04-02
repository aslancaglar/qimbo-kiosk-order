
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus } from 'lucide-react';
import { ToppingItem } from '@/components/cart/types';
import { supabase } from '@/integrations/supabase/client';

interface ToppingCategory {
  id: number;
  name: string;
  min_selection: number;
  max_selection: number;
  required: boolean;
}

interface ToppingOption {
  id: number;
  name: string;
  price: number;
  category_id: number;
  max_quantity: number;
}

interface ToppingSelectorProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedToppings: ToppingItem[]) => void;
}

const ToppingSelector: React.FC<ToppingSelectorProps> = ({
  productId,
  productName,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const [toppingOptions, setToppingOptions] = useState<ToppingOption[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<ToppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch toppings data when the dialog opens
  React.useEffect(() => {
    if (isOpen) {
      fetchToppingData();
    }
  }, [isOpen, productId]);

  const fetchToppingData = async () => {
    setIsLoading(true);

    try {
      // First fetch the product to get available topping categories
      const { data: productData } = await supabase
        .from('menu_items')
        .select('available_topping_categories')
        .eq('id', parseInt(productId))
        .single();

      if (!productData?.available_topping_categories?.length) {
        setIsLoading(false);
        return;
      }

      const categoryIds = productData.available_topping_categories;

      // Fetch topping categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('topping_categories')
        .select('*')
        .in('id', categoryIds)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setToppingCategories(categoriesData || []);

      // Fetch topping options
      const { data: toppingsData, error: toppingsError } = await supabase
        .from('toppings')
        .select('*')
        .in('category_id', categoryIds)
        .eq('available', true)
        .order('display_order');

      if (toppingsError) throw toppingsError;
      setToppingOptions(toppingsData || []);

      // Reset selected toppings
      setSelectedToppings([]);
    } catch (error) {
      console.error('Error fetching toppings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToppingQuantityChange = (topping: ToppingOption, change: number) => {
    setSelectedToppings(prev => {
      // Find if this topping is already selected
      const existingIndex = prev.findIndex(item => item.id === topping.id);
      
      // If it exists and we're decreasing to 0, remove it
      if (existingIndex >= 0 && prev[existingIndex].quantity + change <= 0) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      // If it exists and we're changing the quantity
      if (existingIndex >= 0) {
        // Make sure we don't exceed max_quantity
        const newQuantity = Math.min(prev[existingIndex].quantity + change, topping.max_quantity);
        const newToppings = [...prev];
        newToppings[existingIndex] = {
          ...newToppings[existingIndex],
          quantity: newQuantity
        };
        return newToppings;
      }
      
      // If it doesn't exist and we're adding it
      if (change > 0) {
        return [...prev, {
          id: topping.id,
          name: topping.name,
          price: topping.price,
          quantity: 1
        }];
      }
      
      return prev;
    });
  };

  const getToppingQuantity = (toppingId: number): number => {
    const topping = selectedToppings.find(t => t.id === toppingId);
    return topping ? topping.quantity : 0;
  };

  const handleConfirm = () => {
    onConfirm(selectedToppings);
  };

  const groupedToppingOptions = toppingOptions.reduce((acc, topping) => {
    if (!acc[topping.category_id]) {
      acc[topping.category_id] = [];
    }
    acc[topping.category_id].push(topping);
    return acc;
  }, {} as Record<number, ToppingOption[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose toppings for {productName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {toppingCategories.map(category => (
                <div key={category.id} className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{category.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {category.required ? 'Required' : 'Optional'} 
                      {` (${category.min_selection}-${category.max_selection} selections)`}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {groupedToppingOptions[category.id]?.map(topping => {
                      const quantity = getToppingQuantity(topping.id);
                      return (
                        <div key={topping.id} className="flex justify-between items-center bg-background p-2 rounded">
                          <div>
                            <p className="font-medium">{topping.name}</p>
                            <p className="text-sm text-muted-foreground">€{topping.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              disabled={quantity <= 0}
                              onClick={() => handleToppingQuantityChange(topping, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center">{quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              disabled={quantity >= topping.max_quantity}
                              onClick={() => handleToppingQuantityChange(topping, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {toppingCategories.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">No toppings available for this item</p>
              )}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Add to Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToppingSelector;
