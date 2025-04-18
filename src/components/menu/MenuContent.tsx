
import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import CategorySelector from './CategorySelector';
import ProductCard from './ProductCard';
import { Product } from './ProductCard';
import { ToppingItem } from '../cart/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuContentProps {
  products: Product[];
  categories: string[];
  categoryIcons?: Record<string, string | null>;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isLoading: boolean;
  onProductSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

// Memoized product card component to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);

const MenuContent: React.FC<MenuContentProps> = ({
  products,
  categories,
  categoryIcons = {},
  activeCategory,
  setActiveCategory,
  isLoading,
  onProductSelect
}) => {
  const isMobile = useIsMobile();
  
  // Memoize filtered products to prevent recalculation on every render
  const filteredProducts = useMemo(() => {
    return products.filter(product => product.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-amber-50">
      {/* Show horizontal category selector for mobile */}
      {isMobile && (
        <div className="w-full overflow-x-auto bg-amber-100 sticky top-0 z-10 shadow-sm py-3">
          <CategorySelector 
            categories={categories} 
            categoryIcons={categoryIcons}
            activeCategory={activeCategory} 
            onChange={setActiveCategory}
            orientation="horizontal"
          />
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Show vertical category selector only on desktop */}
        {!isMobile && (
          <div className="w-32 md:w-36 bg-gradient-to-b from-yellow-400 to-yellow-500 overflow-y-auto">
            <CategorySelector 
              categories={categories} 
              categoryIcons={categoryIcons}
              activeCategory={activeCategory} 
              onChange={setActiveCategory}
              orientation="vertical"
            />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 md:pb-[60px]">
          <div className="mb-4">
            <h2 className="text-xl font-bebas tracking-wider text-red-700">{activeCategory}</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <MemoizedProductCard 
                  key={product.id} 
                  product={product} 
                  onSelect={onProductSelect} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 text-lg">No items found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(MenuContent);
