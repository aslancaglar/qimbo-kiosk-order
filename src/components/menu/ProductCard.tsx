
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ToppingItem } from '../cart/types';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  hasToppings?: boolean;
  availableToppings?: number[];
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

// Mock toppings data - in a real app, this would come from an API
const MOCK_TOPPINGS: ToppingItem[] = [
  { id: 1, name: "Cheese", price: 1.50 },
  { id: 2, name: "Pepperoni", price: 2.00 },
  { id: 3, name: "Mushrooms", price: 1.00 },
  { id: 4, name: "Onions", price: 0.75 },
  { id: 5, name: "Bacon", price: 2.50 },
  { id: 6, name: "Extra Sauce", price: 0.50 },
  { id: 7, name: "Jalapeños", price: 1.00 },
  { id: 8, name: "Pineapple", price: 1.25 },
];

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<ToppingItem[]>([]);
  
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
  
  const handleToppingToggle = (topping: ToppingItem) => {
    if (selectedToppings.some(t => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter(t => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };
  
  const handleAddToCart = () => {
    onSelect(product, selectedToppings);
    setIsModalOpen(false);
  };
  
  // Filter available toppings if specified in the product
  const availableToppings = product.availableToppings 
    ? MOCK_TOPPINGS.filter(topping => product.availableToppings?.includes(topping.id))
    : MOCK_TOPPINGS;
  
  // Calculate total price with selected toppings
  const totalPrice = product.price + selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
  
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your {product.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="text-sm font-medium mb-3">Add Toppings</h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableToppings.map((topping) => (
                <div 
                  key={topping.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border"
                >
                  <Checkbox 
                    id={`topping-${topping.id}`}
                    checked={selectedToppings.some(t => t.id === topping.id)}
                    onCheckedChange={() => handleToppingToggle(topping)}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`topping-${topping.id}`}
                      className="text-sm font-medium cursor-pointer flex justify-between"
                    >
                      <span>{topping.name}</span>
                      <span className="text-gray-600">+${topping.price.toFixed(2)}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
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
