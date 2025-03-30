
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { Plus, Minus, Check } from 'lucide-react';
import { ToppingItem } from '../cart/types';
import { startMeasure, endMeasure } from "@/utils/performanceMonitor";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

// Lazy load the heavy components
const CustomizationDialog = lazy(() => import('./CustomizationDialog'));

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

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (product.hasToppings && product.availableToppingCategories && product.availableToppingCategories.length > 0) {
      startMeasure('openCustomizationDialog');
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

  // Clean up performance measure when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      endMeasure('openCustomizationDialog');
    }
  }, [isDialogOpen]);

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
      
      {isDialogOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                <p>Chargement des options...</p>
              </div>
            </div>
          </div>
        }>
          <CustomizationDialog 
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            product={product}
            onSubmit={handleToppingSubmit}
          />
        </Suspense>
      )}
    </motion.div>
  );
};

export default React.memo(ProductCard);
