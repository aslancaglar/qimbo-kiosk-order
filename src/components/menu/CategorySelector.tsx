
import React from 'react';
import { motion } from 'framer-motion';

interface CategorySelectorProps {
  categories: string[];
  categoryIcons?: Record<string, string | null>;
  activeCategory: string;
  onChange: (category: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  categoryIcons = {},
  activeCategory,
  onChange,
  orientation = 'horizontal',
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${isVertical ? 'h-full py-2' : 'py-2 px-3'}`}
    >
      <div className={`${isVertical 
        ? 'flex flex-col gap-1 items-center' 
        : 'flex flex-wrap gap-2 justify-center py-2'}`}>
        
        {categories.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            icon={categoryIcons[category]}
            isActive={activeCategory === category}
            onChange={onChange}
            isVertical={isVertical}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface CategoryButtonProps {
  category: string;
  icon: string | null;
  isActive: boolean;
  onChange: (category: string) => void;
  isVertical: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  icon,
  isActive,
  onChange,
  isVertical,
}) => {
  // Helper function to get emoji based on category name
  const getCategoryEmoji = (category: string) => {
    const lowercased = category.toLowerCase();
    if (lowercased === 'all') return '🍽️';
    if (lowercased.includes('burger')) return '🍔';
    if (lowercased.includes('pizza')) return '🍕';
    if (lowercased.includes('pasta')) return '🍝';
    if (lowercased.includes('salad')) return '🥗';
    if (lowercased.includes('dessert')) return '🍰';
    if (lowercased.includes('drink')) return '🥤';
    if (lowercased.includes('side')) return '🍟';
    return '📋';
  };
  
  // Apply different styles based on vertical/horizontal orientation
  if (isVertical) {
    return (
      <button
        onClick={() => onChange(category)}
        className={`relative px-2 py-3 w-full text-center flex flex-col items-center justify-center text-base font-medium transition-colors`}
      >
        {isActive && (
          <motion.div
            layoutId="activeCategory-vertical"
            className="absolute left-0 w-1 h-full bg-red-600 z-0"
            transition={{ type: 'spring', duration: 0.5 }}
          />
        )}
        
        <div className="mb-1 text-2xl">
          {icon ? (
            <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center">
              <img 
                src={icon} 
                alt={category} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.style.display = 'none';
                  const nextElement = imgElement.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <span className="hidden">{getCategoryEmoji(category)}</span>
            </div>
          ) : (
            <span>{getCategoryEmoji(category)}</span>
          )}
        </div>
        
        <span className={`relative z-10 text-sm font-bold ${
          isActive ? 'text-red-600 font-bold' : 'text-gray-600 hover:text-gray-900'
        }`}>
          {category}
        </span>
      </button>
    );
  }
  
  // Mobile horizontal style matching the provided image
  return (
    <button
      onClick={() => onChange(category)}
      className={`
        px-4 py-2 my-1
        rounded-lg
        uppercase text-sm font-bold tracking-wide
        ${isActive
          ? 'bg-red-800 text-yellow-300'
          : 'bg-red-800 text-white hover:bg-red-700'}
        transition-colors duration-200
      `}
    >
      {category}
    </button>
  );
};

export default CategorySelector;
