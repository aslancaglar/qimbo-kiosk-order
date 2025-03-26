
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Minus } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToppingItem } from '../cart/types';
import { Label } from "@/components/ui/label";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hasToppings?: boolean;
  availableToppingCategories?: number[];
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

// Mock toppings categories data - in a real app, this would come from an API
interface ToppingCategory {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  description: string;
  required: boolean;
  toppings: ToppingItem[];
}

// Mock categories
const MOCK_TOPPING_CATEGORIES: ToppingCategory[] = [
  {
    id: 1,
    name: "Sauces",
    minSelection: 1,
    maxSelection: 2,
    description: "Choose your favorite sauce",
    required: true,
    toppings: [
      { id: 1, name: "Tomato Sauce", price: 0.50, categoryId: 1, maxQuantity: 1 },
      { id: 2, name: "BBQ Sauce", price: 0.75, categoryId: 1, maxQuantity: 1 },
      { id: 3, name: "Ranch", price: 0.75, categoryId: 1, maxQuantity: 1 },
      { id: 4, name: "Hot Sauce", price: 0.50, categoryId: 1, maxQuantity: 1 }
    ]
  },
  {
    id: 2,
    name: "Vegetables",
    minSelection: 0,
    maxSelection: 5,
    description: "Add some veggies",
    required: false,
    toppings: [
      { id: 5, name: "Mushrooms", price: 1.00, categoryId: 2, maxQuantity: 2 },
      { id: 6, name: "Onions", price: 0.75, categoryId: 2, maxQuantity: 2 },
      { id: 7, name: "Bell Peppers", price: 0.75, categoryId: 2, maxQuantity: 2 },
      { id: 8, name: "Jalapeños", price: 1.00, categoryId: 2, maxQuantity: 2 },
      { id: 9, name: "Olives", price: 0.75, categoryId: 2, maxQuantity: 2 }
    ]
  },
  {
    id: 3,
    name: "Cheese",
    minSelection: 0,
    maxSelection: 3,
    description: "Extra cheese options",
    required: false,
    toppings: [
      { id: 10, name: "Mozzarella", price: 1.50, categoryId: 3, maxQuantity: 2 },
      { id: 11, name: "Cheddar", price: 1.50, categoryId: 3, maxQuantity: 2 },
      { id: 12, name: "Parmesan", price: 1.75, categoryId: 3, maxQuantity: 2 }
    ]
  },
  {
    id: 4,
    name: "Meat",
    minSelection: 0,
    maxSelection: 3,
    description: "Premium meat toppings",
    required: false,
    toppings: [
      { id: 13, name: "Pepperoni", price: 2.00, categoryId: 4, maxQuantity: 3 },
      { id: 14, name: "Bacon", price: 2.50, categoryId: 4, maxQuantity: 3 },
      { id: 15, name: "Ham", price: 2.00, categoryId: 4, maxQuantity: 3 },
      { id: 16, name: "Chicken", price: 2.50, categoryId: 4, maxQuantity: 3 }
    ]
  }
];

interface SelectedToppingWithQuantity extends ToppingItem {
  quantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<SelectedToppingWithQuantity[]>([]);
  
  const handleProductClick = () => {
    if (product.hasToppings) {
      // If product has toppings, open the toppings modal
      setIsModalOpen(true);
      setSelectedToppings([]);
    } else {
      // If no toppings, add to cart directly
      onSelect(product);
    }
  };
  
  const handleToppingToggle = (topping: ToppingItem, categoryId: number) => {
    const category = MOCK_TOPPING_CATEGORIES.find(c => c.id === categoryId)!;
    const existingTopping = selectedToppings.find(t => t.id === topping.id);
    
    if (existingTopping) {
      // Remove topping if already selected
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      // Check if we've reached the maximum selections for this category
      const currentCategorySelections = selectedToppings.filter(t => t.categoryId === categoryId);
      
      if (currentCategorySelections.length >= category.maxSelection) {
        // Cannot add more toppings from this category
        return;
      }
      
      // Add topping with quantity 1
      setSelectedToppings([...selectedToppings, { ...topping, quantity: 1 }]);
    }
  };
  
  const incrementToppingQuantity = (toppingId: number) => {
    setSelectedToppings(prevToppings => 
      prevToppings.map(t => {
        if (t.id === toppingId) {
          const currentTopping = MOCK_TOPPING_CATEGORIES
            .flatMap(c => c.toppings)
            .find(topping => topping.id === toppingId);
            
          if (currentTopping && t.quantity < currentTopping.maxQuantity) {
            return { ...t, quantity: t.quantity + 1 };
          }
        }
        return t;
      })
    );
  };
  
  const decrementToppingQuantity = (toppingId: number) => {
    setSelectedToppings(prevToppings => 
      prevToppings.map(t => {
        if (t.id === toppingId && t.quantity > 1) {
          return { ...t, quantity: t.quantity - 1 };
        }
        return t;
      })
    );
  };
  
  const handleAddToCart = () => {
    // Validate if required selections are met
    const validSelection = MOCK_TOPPING_CATEGORIES.every(category => {
      if (category.required) {
        const selectedCount = selectedToppings.filter(t => t.categoryId === category.id).length;
        return selectedCount >= category.minSelection;
      }
      return true;
    });
    
    if (!validSelection) {
      // Show an error or toast that required selections aren't met
      alert("Please make all required selections before adding to cart");
      return;
    }
    
    // Convert selected toppings to the format expected by the cart
    const finalToppings = selectedToppings.map(({ id, name, price, quantity }) => {
      // Create multiple entries based on quantity
      return Array(quantity).fill({ id, name, price });
    }).flat();
    
    onSelect(product, finalToppings);
    setIsModalOpen(false);
  };
  
  // Filter available topping categories if specified in the product
  const availableCategories = product.availableToppingCategories 
    ? MOCK_TOPPING_CATEGORIES.filter(category => 
        product.availableToppingCategories?.includes(category.id))
    : MOCK_TOPPING_CATEGORIES;
  
  // Calculate total price with selected toppings
  const totalPrice = product.price + selectedToppings.reduce(
    (sum, topping) => sum + (topping.price * topping.quantity), 0
  );
  
  // Check if selections meet requirements for each category
  const getCategoryValidationStatus = (categoryId: number) => {
    const category = MOCK_TOPPING_CATEGORIES.find(c => c.id === categoryId);
    if (!category || !category.required) return { valid: true, message: "" };
    
    const selectedCount = selectedToppings.filter(t => t.categoryId === categoryId).length;
    
    if (selectedCount < category.minSelection) {
      return { 
        valid: false, 
        message: `Select at least ${category.minSelection} ${category.minSelection === 1 ? 'option' : 'options'}`
      };
    }
    
    return { valid: true, message: "" };
  };
  
  return (
    <>
      <motion.div
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-xl overflow-hidden shadow-card flex flex-col h-full cursor-pointer max-w-[250px] w-full mx-auto"
        onClick={handleProductClick}
      >
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{product.name}</h3>
            <span className="font-semibold text-lg">
              ${product.price.toFixed(2)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 flex-1 line-clamp-2 mb-2">
            {product.description}
          </p>
          
          {product.hasToppings && (
            <span className="text-xs text-blue-600 mb-2">Customizable</span>
          )}
          
          <button 
            className="self-end mt-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleProductClick();
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      </motion.div>
      
      {/* Toppings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Customize Your {product.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-2 flex-1 overflow-y-auto">
            {availableCategories.map((category) => {
              const validation = getCategoryValidationStatus(category.id);
              
              return (
                <div key={category.id} className="mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-sm font-medium">
                      {category.name}
                      {category.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {category.minSelection > 0 ? 
                        `Choose ${category.minSelection}-${category.maxSelection}` : 
                        `Up to ${category.maxSelection}`}
                    </span>
                  </div>
                  
                  {category.description && (
                    <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                  )}
                  
                  {!validation.valid && (
                    <p className="text-xs text-red-500 mb-2">{validation.message}</p>
                  )}
                  
                  <div className="space-y-3">
                    {category.toppings.map((topping) => {
                      const isSelected = selectedToppings.some(t => t.id === topping.id);
                      
                      return (
                        <div 
                          key={topping.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox 
                              id={`topping-${topping.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleToppingToggle(topping, category.id)}
                            />
                            <div>
                              <Label 
                                htmlFor={`topping-${topping.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {topping.name}
                              </Label>
                              <div className="text-xs text-muted-foreground">
                                +${topping.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && topping.maxQuantity > 1 && (
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  decrementToppingQuantity(topping.id);
                                }}
                                disabled={selectedToppings.find(t => t.id === topping.id)?.quantity === 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="text-sm w-4 text-center">
                                {selectedToppings.find(t => t.id === topping.id)?.quantity || 1}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  incrementToppingQuantity(topping.id);
                                }}
                                disabled={
                                  (selectedToppings.find(t => t.id === topping.id)?.quantity || 0) >= topping.maxQuantity
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t pt-4 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Price:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
