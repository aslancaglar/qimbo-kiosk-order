
import React from 'react';
import { motion } from 'framer-motion';

interface CategorySelectorProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
  orientation?: 'horizontal' | 'vertical';
  categoryIcons?: Record<string, string | null>;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  onChange,
  orientation = 'horizontal',
  categoryIcons = {},
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${isVertical ? 'h-full py-2' : 'overflow-x-auto py-4 px-6'}`}
    >
      <div className={`${isVertical 
        ? 'flex flex-col gap-1 items-center' 
        : 'flex gap-4 min-w-max'}`}>
        {/* Always include All category */}
        <CategoryButton
          category="All"
          isActive={activeCategory === 'All'}
          onChange={onChange}
          isVertical={isVertical}
          iconUrl={null}
        />
        
        {categories.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            isActive={activeCategory === category}
            onChange={onChange}
            isVertical={isVertical}
            iconUrl={categoryIcons[category]}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface CategoryButtonProps {
  category: string;
  isActive: boolean;
  onChange: (category: string) => void;
  isVertical: boolean;
  iconUrl: string | null;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  isActive,
  onChange,
  isVertical,
  iconUrl,
}) => {
  // Helper function to determine icon
  const getIconContent = () => {
    if (iconUrl) {
      return (
        <img 
          src={iconUrl} 
          alt={category} 
          className="w-8 h-8 object-cover rounded"
        />
      );
    }
    
    // Default emoji fallbacks
    return (
      <div className="text-xl">
        {category === 'All' && '🍽️'}
        {category === 'Burgers' && '🍔'}
        {category === 'Pizza' && '🍕'}
        {category === 'Pasta' && '🍝'}
        {category === 'Salad' && '🥗'}
        {category === 'Dessert' && '🍰'}
        {category === 'Drinks' && '🥤'}
        {category === 'Sides' && '🍟'}
        {(!['All', 'Burgers', 'Pizza', 'Pasta', 'Salad', 'Dessert', 'Drinks', 'Sides'].includes(category)) && '📋'}
      </div>
    );
  };

  return (
    <button
      onClick={() => onChange(category)}
      className={`relative ${isVertical 
        ? 'px-2 py-3 w-full text-center flex flex-col items-center justify-center' 
        : 'px-5 py-2 rounded-md'} text-base font-medium transition-colors`}
    >
      {isActive && (
        <motion.div
          layoutId={`activeCategory-${isVertical ? 'vertical' : 'horizontal'}`}
          className={`absolute ${isVertical 
            ? 'left-0 w-1 h-full bg-red-600' 
            : 'inset-0 bg-gray-100 rounded-md'} z-0`}
          transition={{ type: 'spring', duration: 0.5 }}
        />
      )}
      
      {/* Icon for categories - either custom or emoji */}
      {isVertical && (
        <div className="mb-1">
          {getIconContent()}
        </div>
      )}
      
      <span className={`relative z-10 ${isVertical ? 'text-xs' : ''} ${
        isActive
          ? isVertical ? 'text-red-600 font-bold' : 'text-primary' 
          : 'text-gray-600 hover:text-gray-900'
      }`}>
        {isVertical ? (category.length > 7 ? category.substring(0, 7) + '...' : category) : category}
      </span>
    </button>
  );
};

export default CategorySelector;
