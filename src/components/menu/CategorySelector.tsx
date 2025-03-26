
import React from 'react';
import { motion } from 'framer-motion';

interface CategorySelectorProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  onChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-x-auto py-4 px-6"
    >
      <div className="flex gap-4 min-w-max">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`relative px-5 py-2 rounded-md text-base font-medium transition-colors ${
              activeCategory === category
                ? 'text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeCategory === category && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-gray-100 rounded-md z-0"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{category}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default CategorySelector;
