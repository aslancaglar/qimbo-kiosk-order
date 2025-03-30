
import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ToppingCategory, Topping, ToppingFormValues } from './types/toppingTypes';
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Button from '../common/Button';
import { ToppingItem } from '../cart/types';

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

interface ToppingsCustomizationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  toppingCategories: ToppingCategory[];
  isLoading: boolean;
  productName: string;
  onSubmit: (selectedToppings: ToppingItem[]) => void;
  initialToppings?: (Topping & { quantity: number })[];
}

const ToppingsCustomizationDialog: React.FC<ToppingsCustomizationDialogProps> = ({
  isOpen,
  onOpenChange,
  toppingCategories,
  isLoading,
  productName,
  onSubmit,
  initialToppings = []
}) => {
  const { toast } = useToast();
  
  const form = useForm<ToppingFormValues>({
    resolver: zodResolver(toppingsFormSchema),
    defaultValues: {
      selectedToppings: initialToppings.length > 0 ? 
        initialToppings : 
        toppingCategories.flatMap(category => 
          category.toppings.map(topping => ({
            ...topping,
            quantity: 0
          }))
        )
    }
  });
  
  React.useEffect(() => {
    if (isOpen && toppingCategories.length > 0 && initialToppings.length === 0) {
      const allToppings = toppingCategories.flatMap(category => 
        category.toppings.map(topping => ({
          ...topping,
          quantity: 0
        }))
      );
      
      form.reset({
        selectedToppings: allToppings
      });
    }
  }, [isOpen, toppingCategories, form, initialToppings]);
  
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
        variant: 'destructive',
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
  
  const handleToppingSubmit = (data: ToppingFormValues) => {
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
      const categoryToppingsCount = selectedToppings
        .filter(topping => topping.categoryId === category.id)
        .length;
      
      if (category.required && categoryToppingsCount < category.minSelection) {
        validationErrors.push(`You must select at least ${category.minSelection} items from ${category.name}`);
      }
    });
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast({
          title: 'Selection Required',
          description: error,
          variant: 'destructive',
        });
      });
      return;
    }
    
    onSubmit(selectedToppings);
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Your {productName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                      const toppingInForm = form.watch('selectedToppings').find(t => t.id === topping.id);
                      const quantity = toppingInForm ? toppingInForm.quantity : 0;
                      
                      return (
                        <div key={topping.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="font-medium">{topping.name}</p>
                            {topping.price > 0 && (
                              <p className="text-sm text-gray-500">${topping.price.toFixed(2)}</p>
                            )}
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
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-5 text-center font-medium">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleIncrementTopping(topping.id)}
                                disabled={quantity >= (topping.maxQuantity || 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                              >
                                <Plus className="h-4 w-4" />
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
              
              <DialogFooter>
                <Button type="submit" size="full">
                  Add to Order
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ToppingsCustomizationDialog;
