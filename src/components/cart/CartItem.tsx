
import React from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { CartItemType } from './types';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  isTablet?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onRemove,
  onIncrement,
  onDecrement,
  isTablet = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="py-4 border-b border-gray-100 last:border-0"
    >
      <div className="flex items-start gap-3">
        {/* We hide the image when isTablet is true */}
        {!isTablet && (
          <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
            <button
              className="text-gray-400 hover:text-gray-900 p-1 -m-1"
              onClick={onRemove}
            >
              <X size={16} />
            </button>
          </div>
          
          {item.options && item.options.length > 0 && (
            <div className="mt-1 mb-2">
              {item.options.map((option, index) => (
                <span 
                  key={index} 
                  className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 mr-1"
                >
                  {option.value}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <span className="font-medium">
              {(item.product.price * item.quantity).toFixed(2)} €
              {isTablet && item.quantity > 1 && ` (x${item.quantity})`}
            </span>
            
            {!isTablet && (
              <div className="flex items-center gap-3">
                <button
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  onClick={onDecrement}
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                
                <span className="text-sm font-medium w-4 text-center">
                  {item.quantity}
                </span>
                
                <button
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  onClick={onIncrement}
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
