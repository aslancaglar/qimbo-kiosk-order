
import React from 'react';
import { motion } from 'framer-motion';
import CategorySelector from './CategorySelector';
import ProductCard, { Product } from './ProductCard';
import { ToppingItem } from '../cart/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuContentProps {
  products: Product[];
  categories: string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isLoading: boolean;
  onProductSelect: (product: Product, selectedToppings?: ToppingItem[]) => void;
}

const MenuContent: React.FC<MenuContentProps> = ({
  products,
  categories,
  activeCategory,
  setActiveCategory,
  isLoading,
  onProductSelect
}) => {
  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(product => product.category === activeCategory);

  return (
    <div className="flex flex-1 overflow-hidden bg-amber-50">
      <div className="w-20 md:w-24 bg-gradient-to-b from-yellow-400 to-yellow-500 overflow-y-auto">
        <CategorySelector 
          categories={categories} 
          activeCategory={activeCategory} 
          onChange={setActiveCategory}
          orientation="vertical"
        />
      </div>
      
      <ScrollArea className="flex-1 h-full">
        <div className="p-4 md:pb-[60px]">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-red-700">{activeCategory}</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard 
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
      </ScrollArea>
    </div>
  );
};

export default MenuContent;
