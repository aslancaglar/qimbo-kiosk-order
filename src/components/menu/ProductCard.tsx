
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { ShoppingBag, Check } from 'lucide-react';
import { ToppingItem } from '../cart/types';
import { Product } from './types/productTypes';
import { useToppingCategories } from './hooks/useToppingCategories';
import ToppingsCustomizationDialog from './ToppingsCustomizationDialog';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const { isLoading, toppingCategories, fetchToppingCategories } = useToppingCategories();
  
  const handleAddToCart = () => {
    if (product.hasToppings && product.availableToppingCategories && product.availableToppingCategories.length > 0) {
      fetchToppingCategories(product);
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
  
  const handleToppingSubmit = (selectedToppings: ToppingItem[]) => {
    onSelect(product, selectedToppings);
    setIsDialogOpen(false);
    showAddedConfirmation();
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
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
          
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
              <Button size="sm" onClick={handleAddToCart} className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2">
                <ShoppingBag className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <ToppingsCustomizationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        toppingCategories={toppingCategories}
        isLoading={isLoading}
        productName={product.name}
        onSubmit={handleToppingSubmit}
      />
    </motion.div>
  );
};

export default ProductCard;
