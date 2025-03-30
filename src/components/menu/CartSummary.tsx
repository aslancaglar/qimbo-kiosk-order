
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../cart/types';
import CartItem from '../cart/CartItem';
import Button from '../common/Button';
import { formatCurrency } from '@/utils/printUtils';

interface CartSummaryProps {
  cartItems: CartItemType[];
  onRemoveItem: (itemId: string) => void;
  onIncrementItem: (itemId: string) => void;
  onDecrementItem: (itemId: string) => void;
  onCancelOrderClick: () => void;
  onConfirmOrder: () => void;
  orderType: string;
  tableNumber?: string | number;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cartItems,
  onRemoveItem,
  onIncrementItem,
  onDecrementItem,
  onCancelOrderClick,
  onConfirmOrder,
  orderType,
  tableNumber,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );
  
  const tax = subtotal * 0.0875; // Assuming 8.75% tax rate
  const total = subtotal + tax;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: isMinimized ? 'calc(100% - 60px)' : 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed inset-x-0 bottom-0 z-10 bg-white border-t shadow-lg"
      style={{ height: 'auto', maxHeight: '60vh' }}
    >
      <div 
        className="p-3 border-b flex justify-between items-center cursor-pointer bg-red-600 text-white"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center">
          <ShoppingBag className="mr-2 h-5 w-5" />
          <h3 className="font-semibold">
            {isMinimized 
              ? `Panier (${totalItems} article${totalItems !== 1 ? 's' : ''}) - ${formatCurrency(total)}`
              : 'Votre Commande'
            }
          </h3>
        </div>
        <button className="p-1" onClick={(e) => {
          e.stopPropagation();
          onCancelOrderClick();
        }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {!isMinimized && (
        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(60vh - 130px)' }}>
          {cartItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <ShoppingBag className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={() => onRemoveItem(item.id)}
                    onIncrement={() => onIncrementItem(item.id)}
                    onDecrement={() => onDecrementItem(item.id)}
                  />
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Sous-total:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">TVA (8.75%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                {orderType === 'dine-in' && (
                  <p>Table: {tableNumber}</p>
                )}
                {orderType === 'take-out' && (
                  <p>À emporter</p>
                )}
              </div>
              
              <Button 
                variant="default"
                size="full"
                onClick={onConfirmOrder}
                disabled={cartItems.length === 0}
                className="w-full justify-center"
              >
                Confirmer la commande
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CartSummary;
