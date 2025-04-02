
import React from 'react';
import { motion } from 'framer-motion';
import { Pizza, Coffee, Utensils } from 'lucide-react';

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
      className={`w-full ${isVertical ? 'h-full py-2' : 'overflow-x-auto py-4 px-6'}`}
    >
      <div className={`${isVertical 
        ? 'flex flex-col gap-1 items-center' 
        : 'flex gap-4 min-w-max'}`}>
        
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
      
      {/* Icon for categories - use uploaded icon or fallback to emoji */}
      {isVertical && (
        <div className="mb-1 text-2xl">
          {icon ? (
            <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center">
              <img 
                src={icon} 
                alt={category} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fix TypeScript error by using the correct HTMLImageElement type
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.style.display = 'none';
                  // Use optional chaining and type assertion for the next element
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
      )}
      
      <span className={`relative z-10 ${isVertical ? 'text-sm font-bold' : ''} ${
        isActive
          ? isVertical ? 'text-red-600 font-bold' : 'text-primary' 
          : 'text-gray-600 hover:text-gray-900'
      }`}>
        {isVertical ? category : category}
      </span>
    </button>
  );
};

export default CategorySelector;
