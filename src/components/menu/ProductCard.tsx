
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { Plus, Minus, Check } from 'lucide-react';
import { ToppingItem } from '../cart/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hasToppings: boolean;
  availableToppingCategories?: number[];
}

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

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

const toppingsFormSchema = z.object({
  selectedToppings: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    categoryId: z.number(),
    quantity: z.number().min(0),
    maxQuantity: z.number().optional()
  }))
});

type ToppingsFormValues = z.infer<typeof toppingsFormSchema>;

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const form = useForm<ToppingsFormValues>({
    resolver: zodResolver(toppingsFormSchema),
    defaultValues: {
      selectedToppings: []
    }
  });

  const handleAddToCart = () => {
    if (product.hasToppings && product.availableToppingCategories && product.availableToppingCategories.length > 0) {
      fetchToppingCategories();
      setIsDialogOpen(true);
    } else {
      onSelect(product);
      showAddedConfirmation();
    }
  };

  const showAddedConfirmation = () => {
    setShowAddedAnimation(true);
    setTimeout(() => {
      setShowAddedAnimation(false);
    }, 1500);
  };

  const fetchToppingCategories = async () => {
    if (!product.availableToppingCategories || product.availableToppingCategories.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      form.reset({ selectedToppings: [] });
      
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
          .order('display_order', { ascending: true }) // Order by display_order first
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

      const allToppings = categories.flatMap(category => 
        category.toppings.map(topping => ({
          ...topping,
          quantity: 0
        }))
      );

      form.reset({ selectedToppings: allToppings });
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

  const handleIncrementTopping = (toppingId: number) => {
    const currentToppings = [...form.getValues().selectedToppings];
    const toppingIndex = currentToppings.findIndex(t => t.id === toppingId);
    
    if (toppingIndex === -1) return;
    
    const topping = currentToppings[toppingIndex];
    const maxQuantity = topping.maxQuantity || 1;
    
    if (topping.quantity >= maxQuantity) return;
    
    const categoryId = topping.categoryId;
    const category = toppingCategories.find(c => c.id === categoryId);
    
    if (!category) return;
    
    const currentSelections = currentToppings
      .filter(t => t.categoryId === categoryId)
      .reduce((sum, t) => sum + (t.quantity > 0 ? 1 : 0), 0);
    
    if (topping.quantity === 0 && currentSelections >= category.maxSelection) {
      toast({
        title: 'Maximum reached',
        description: `You can only select up to ${category.maxSelection} items from ${category.name}`,
        variant: 'destructive'
      });
      return;
    }
    
    currentToppings[toppingIndex] = {
      ...topping,
      quantity: topping.quantity + 1
    };
    
    form.setValue('selectedToppings', currentToppings, { shouldValidate: true });
  };

  const handleDecrementTopping = (toppingId: number) => {
    const currentToppings = [...form.getValues().selectedToppings];
    const toppingIndex = currentToppings.findIndex(t => t.id === toppingId);
    
    if (toppingIndex === -1) return;
    
    const topping = currentToppings[toppingIndex];
    
    if (topping.quantity <= 0) return;
    
    currentToppings[toppingIndex] = {
      ...topping,
      quantity: topping.quantity - 1
    };
    
    form.setValue('selectedToppings', currentToppings, { shouldValidate: true });
  };

  const handleToppingSubmit = (data: ToppingsFormValues) => {
    const selectedToppings = data.selectedToppings
      .filter(topping => topping.quantity > 0)
      .map(topping => ({
        id: topping.id,
        name: topping.name,
        price: topping.price * topping.quantity,
        categoryId: topping.categoryId,
        quantity: topping.quantity
      }));

    const validationErrors: string[] = [];
    
    toppingCategories.forEach(category => {
      const categoryToppingsCount = selectedToppings.filter(topping => topping.categoryId === category.id).length;
      
      if (category.required && categoryToppingsCount < category.minSelection) {
        validationErrors.push(`You must select at least ${category.minSelection} items from ${category.name}`);
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

    onSelect(product, selectedToppings);
    setIsDialogOpen(false);
    showAddedConfirmation();
  };

  const isCategoryValid = (categoryId: number): boolean => {
    const category = toppingCategories.find(c => c.id === categoryId);
    
    if (!category || !category.required) return true;
    
    const selectedCount = form.getValues().selectedToppings
      .filter(t => t.categoryId === categoryId && t.quantity > 0)
      .length;
    
    return selectedCount >= category.minSelection;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col relative"
    >
      <div className="h-32 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
        />
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
        <p className="text-gray-600 text-xs mb-2 flex-1 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center gap-3 mt-auto">
          <span className="font-bold text-sm whitespace-nowrap">{product.price.toFixed(2)} €</span>
          
          <AnimatePresence>
            {showAddedAnimation ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                <Check className="h-5 w-5" />
              </motion.div>
            ) : (
              <Button 
                size="sm" 
                onClick={handleAddToCart} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2"
              >
                Ajouter au panier
              </Button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="sm:max-w-[80%] w-[95%] max-h-[90vh] p-0 overflow-hidden flex flex-col"
          enableScrollArea={false}
        >
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Customize Your {product.name}</DialogTitle>
            </DialogHeader>
            
            {isLoading ? (
              <div className="flex justify-center p-8 flex-1">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleToppingSubmit)} className="flex flex-col h-full">
                  <ScrollArea className="flex-1 max-h-[calc(80vh-160px)] overflow-auto px-6">
                    <div className="py-6 space-y-6">
                      {toppingCategories.map(category => (
                        <div key={category.id} className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{category.name}</h3>
                              <p className="text-sm text-gray-500">
                                {category.required ? 'Required' : 'Optional'} · 
                                Select {category.minSelection > 0 ? `${category.minSelection}-` : ''}
                                {category.maxSelection} item{category.maxSelection !== 1 ? 's' : ''}
                              </p>
                            </div>
                            
                            {!isCategoryValid(category.id) && (
                              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          
                          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                            {category.toppings.map(topping => {
                              const toppingInForm = form.watch('selectedToppings').find(t => t.id === topping.id);
                              const quantity = toppingInForm ? toppingInForm.quantity : 0;
                              
                              return (
                                <div key={topping.id} className="flex justify-between items-center py-2 px-3 border rounded-md">
                                  <div>
                                    <p className="font-medium text-sm">{topping.name}</p>
                                    {topping.price > 0 && <p className="text-xs text-gray-500">{topping.price.toFixed(2)} €</p>}
                                  </div>
                                  
                                  {quantity === 0 ? (
                                    <button 
                                      type="button" 
                                      onClick={() => handleIncrementTopping(topping.id)}
                                      className="flex items-center justify-center p-1 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                                    >
                                      <Plus className="h-5 w-5" />
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button 
                                        type="button" 
                                        onClick={() => handleDecrementTopping(topping.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="w-5 text-center font-medium">{quantity}</span>
                                      <button 
                                        type="button" 
                                        onClick={() => handleIncrementTopping(topping.id)}
                                        disabled={quantity >= (topping.maxQuantity || 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          <Separator />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <DialogFooter className="p-6 border-t mt-auto">
                    <Button type="submit" size="full" className="bg-green-800 hover:bg-green-700">
                      Ajouter au panier
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProductCard;
