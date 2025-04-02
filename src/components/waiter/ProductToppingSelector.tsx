
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';
import { ToppingItem } from '@/components/cart/types';
import { Product } from '@/components/menu/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface ProductToppingSelectorProps {
  product: Product;
  toppingCategories: ToppingCategory[];
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: (selectedToppings: ToppingItem[]) => void;
}

const ProductToppingSelector: React.FC<ProductToppingSelectorProps> = ({
  product,
  toppingCategories,
  isLoading,
  onCancel,
  onConfirm
}) => {
  const { toast } = useToast();
  const [selectedToppings, setSelectedToppings] = useState<ToppingItem[]>([]);
  
  // Initialize selected toppings with quantity 0
  useEffect(() => {
    if (toppingCategories.length > 0) {
      const initialToppings: ToppingItem[] = [];
      
      toppingCategories.forEach(category => {
        category.toppings.forEach(topping => {
          initialToppings.push({
            id: topping.id,
            name: topping.name,
            price: topping.price,
            categoryId: topping.categoryId,
            quantity: 0,
            maxQuantity: topping.maxQuantity
          });
        });
      });
      
      setSelectedToppings(initialToppings);
    }
  }, [toppingCategories]);
  
  const handleIncrementTopping = (toppingId: number) => {
    setSelectedToppings(prev => {
      const newToppings = [...prev];
      const toppingIndex = newToppings.findIndex(t => t.id === toppingId);
      
      if (toppingIndex === -1) return prev;
      
      const topping = newToppings[toppingIndex];
      const maxQuantity = topping.maxQuantity || 1;
      
      if (topping.quantity >= maxQuantity) return prev;
      
      const categoryId = topping.categoryId;
      const category = toppingCategories.find(c => c.id === categoryId);
      
      if (!category) return prev;
      
      const currentSelections = newToppings
        .filter(t => t.categoryId === categoryId)
        .reduce((sum, t) => sum + (t.quantity > 0 ? 1 : 0), 0);
      
      if (topping.quantity === 0 && currentSelections >= category.maxSelection) {
        toast({
          title: 'Maximum reached',
          description: `You can only select up to ${category.maxSelection} items from ${category.name}`,
          variant: 'destructive'
        });
        return prev;
      }
      
      newToppings[toppingIndex] = {
        ...topping,
        quantity: topping.quantity + 1
      };
      
      return newToppings;
    });
  };
  
  const handleDecrementTopping = (toppingId: number) => {
    setSelectedToppings(prev => {
      const newToppings = [...prev];
      const toppingIndex = newToppings.findIndex(t => t.id === toppingId);
      
      if (toppingIndex === -1) return prev;
      
      const topping = newToppings[toppingIndex];
      
      if (topping.quantity <= 0) return prev;
      
      newToppings[toppingIndex] = {
        ...topping,
        quantity: topping.quantity - 1
      };
      
      return newToppings;
    });
  };

  const handleSubmit = () => {
    // Validate selections
    const validationErrors: string[] = [];
    
    toppingCategories.forEach(category => {
      if (category.required) {
        const selectedCount = selectedToppings
          .filter(t => t.categoryId === category.id && t.quantity > 0)
          .length;
        
        if (selectedCount < category.minSelection) {
          validationErrors.push(`You must select at least ${category.minSelection} item(s) from ${category.name}`);
        }
      }
    });
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast({
          title: 'Selection Required',
          description: error,
          variant: 'destructive'
        });
      });
      return;
    }
    
    // Filter out toppings with quantity 0
    const finalToppings = selectedToppings.filter(t => t.quantity > 0);
    onConfirm(finalToppings);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <button onClick={onCancel} className="p-1 rounded-full hover:bg-gray-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 overflow-auto p-4">
            {toppingCategories.map(category => (
              <div key={category.id} className="mb-6">
                <div className="mb-2">
                  <h4 className="font-medium text-sm">{category.name}</h4>
                  <p className="text-xs text-gray-500">
                    {category.required ? 'Required' : 'Optional'} · 
                    Select {category.minSelection > 0 ? `${category.minSelection}-` : ''}
                    {category.maxSelection} item{category.maxSelection !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {category.toppings.map(topping => {
                    const toppingState = selectedToppings.find(t => t.id === topping.id);
                    const quantity = toppingState?.quantity || 0;
                    
                    return (
                      <div key={topping.id} className="flex justify-between items-center p-2 border rounded-md">
                        <div>
                          <p className="text-sm">{topping.name}</p>
                          {topping.price > 0 && <p className="text-xs text-gray-500">{topping.price.toFixed(2)} €</p>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {quantity > 0 && (
                            <button 
                              onClick={() => handleDecrementTopping(topping.id)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                          
                          {quantity > 0 && (
                            <span className="w-4 text-center">{quantity}</span>
                          )}
                          
                          <button 
                            onClick={() => handleIncrementTopping(topping.id)}
                            className={`w-6 h-6 flex items-center justify-center rounded-full ${
                              quantity > 0 ? 'bg-red-600 text-white' : 'bg-gray-100'
                            }`}
                            disabled={quantity >= (topping.maxQuantity || 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
          
          <div className="p-4 border-t">
            <button 
              onClick={handleSubmit}
              className="w-full py-2 bg-red-600 text-white rounded-md font-medium"
            >
              Add to Order
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ProductToppingSelector;
