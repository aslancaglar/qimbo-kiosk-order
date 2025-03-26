
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../common/Button';
import { ShoppingBag, Plus } from 'lucide-react';
import { ToppingItem } from '../cart/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

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

// Schema for the form validation
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

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const { toast } = useToast();
  
  const form = useForm<ToppingsFormValues>({
    resolver: zodResolver(toppingsFormSchema),
    defaultValues: {
      selectedToppings: []
    }
  });
  
  const handleAddToCart = () => {
    if (product.hasToppings && product.availableToppingCategories && product.availableToppingCategories.length > 0) {
      // Fetch topping data and open dialog
      fetchToppingCategories();
      setIsDialogOpen(true);
    } else {
      // No toppings needed, directly add to cart
      onSelect(product);
    }
  };
  
  const fetchToppingCategories = async () => {
    if (!product.availableToppingCategories || product.availableToppingCategories.length === 0) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Reset form when opening dialog
      form.reset({
        selectedToppings: []
      });
      
      // Fetch topping categories that are available for this product
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('topping_categories')
        .select('*')
        .in('id', product.availableToppingCategories)
        .order('name');
      
      if (categoriesError) throw categoriesError;
      
      // Fetch toppings for these categories
      const toppingPromises = categoriesData.map(async category => {
        const { data: toppingsData, error: toppingsError } = await supabase
          .from('toppings')
          .select('*')
          .eq('category_id', category.id)
          .eq('available', true)
          .order('name');
        
        if (toppingsError) throw toppingsError;
        
        // Format the data for our component
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
            maxQuantity: topping.max_quantity || 1
          }))
        };
      });
      
      const categories = await Promise.all(toppingPromises);
      setToppingCategories(categories);
      
      // Initialize form with all available toppings set to quantity 0
      const allToppings = categories.flatMap(category => 
        category.toppings.map(topping => ({
          ...topping,
          quantity: 0
        }))
      );
      
      form.reset({
        selectedToppings: allToppings
      });
      
    } catch (error) {
      console.error('Error fetching toppings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load toppings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleIncrementTopping = (toppingId: number) => {
    const currentToppings = form.getValues().selectedToppings;
    const toppingIndex = currentToppings.findIndex(t => t.id === toppingId);
    
    if (toppingIndex === -1) return;
    
    const topping = currentToppings[toppingIndex];
    const maxQuantity = topping.maxQuantity || 1;
    
    // Don't increment beyond max quantity
    if (topping.quantity >= maxQuantity) return;
    
    // Check if we'd exceed category max selections
    const categoryId = topping.categoryId;
    const category = toppingCategories.find(c => c.id === categoryId);
    
    if (!category) return;
    
    const currentSelections = currentToppings
      .filter(t => t.categoryId === categoryId)
      .reduce((sum, t) => sum + (t.quantity > 0 ? 1 : 0), 0);
    
    // If incrementing would exceed max selections for category, show warning
    if (topping.quantity === 0 && currentSelections >= category.maxSelection) {
      toast({
        title: 'Maximum reached',
        description: `You can only select up to ${category.maxSelection} items from ${category.name}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Update the topping quantity
    const updatedToppings = [...currentToppings];
    updatedToppings[toppingIndex].quantity += 1;
    
    form.setValue('selectedToppings', updatedToppings);
  };
  
  const handleDecrementTopping = (toppingId: number) => {
    const currentToppings = form.getValues().selectedToppings;
    const toppingIndex = currentToppings.findIndex(t => t.id === toppingId);
    
    if (toppingIndex === -1) return;
    
    const topping = currentToppings[toppingIndex];
    
    // Don't decrement below 0
    if (topping.quantity <= 0) return;
    
    // Update the topping quantity
    const updatedToppings = [...currentToppings];
    updatedToppings[toppingIndex].quantity -= 1;
    
    form.setValue('selectedToppings', updatedToppings);
  };
  
  const handleToppingSubmit = (data: ToppingsFormValues) => {
    // Filter out toppings with quantity 0
    const selectedToppings = data.selectedToppings
      .filter(topping => topping.quantity > 0)
      .map(topping => ({
        id: topping.id,
        name: topping.name,
        price: topping.price * topping.quantity, // Multiply price by quantity
        categoryId: topping.categoryId,
        quantity: topping.quantity
      }));
    
    // Validate minimum selections for each category
    const validationErrors: string[] = [];
    
    toppingCategories.forEach(category => {
      const categoryToppingsCount = selectedToppings
        .filter(topping => topping.categoryId === category.id)
        .length;
      
      if (category.required && categoryToppingsCount < category.minSelection) {
        validationErrors.push(`You must select at least ${category.minSelection} items from ${category.name}`);
      }
    });
    
    if (validationErrors.length > 0) {
      // Show errors and stop submission
      validationErrors.forEach(error => {
        toast({
          title: 'Selection Required',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }
    
    // Add selected toppings to cart
    onSelect(product, selectedToppings);
    setIsDialogOpen(false);
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
      className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col"
    >
      <div className="h-40 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2 flex-1">{product.description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-bold">${product.price.toFixed(2)}</span>
          <Button size="sm" onClick={handleAddToCart}>
            <ShoppingBag className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your {product.name}</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleToppingSubmit)} className="space-y-6 p-1">
                  {toppingCategories.map((category) => (
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
                      
                      <div className="space-y-2">
                        {category.toppings.map((topping) => {
                          const toppingInForm = form.getValues().selectedToppings.find(t => t.id === topping.id);
                          const quantity = toppingInForm ? toppingInForm.quantity : 0;
                          
                          return (
                            <div key={topping.id} className="flex justify-between items-center py-2">
                              <div>
                                <p className="font-medium">{topping.name}</p>
                                <p className="text-sm text-gray-500">${topping.price.toFixed(2)}</p>
                              </div>
                              
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleDecrementTopping(topping.id)}
                                  disabled={quantity <= 0}
                                  className="w-8 h-8 flex items-center justify-center rounded-full border disabled:opacity-50"
                                >
                                  -
                                </button>
                                <span className="mx-2 w-6 text-center">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleIncrementTopping(topping.id)}
                                  disabled={quantity >= (topping.maxQuantity || 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full border disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Separator />
                    </div>
                  ))}
                  
                  <DialogFooter>
                    <Button type="submit" size="full">
                      Add to Order
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProductCard;
