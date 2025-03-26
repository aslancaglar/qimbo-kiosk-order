
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white rounded-xl overflow-hidden shadow-card flex flex-col h-full cursor-pointer"
      onClick={() => onSelect(product)}
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
        
        <button 
          className="self-end mt-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
        >
          <Plus size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
