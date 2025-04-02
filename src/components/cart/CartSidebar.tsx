
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import CartItem from './CartItem';
import { CartItemType } from './types';
import { ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemType[];
  onRemoveItem: (index: number) => void;
  onIncrementItem: (index: number) => void;
  onDecrementItem: (index: number) => void;
  orderType: 'takeaway' | 'eat-in';
  tableNumber?: number;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onIncrementItem,
  onDecrementItem,
  orderType,
  tableNumber,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const total = items.reduce((sum, item) => {
    let itemTotal = item.product.price * item.quantity;
    
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      const toppingsPrice = item.selectedToppings.reduce(
        (toppingSum, topping) => toppingSum + topping.price, 0
      );
      itemTotal += toppingsPrice * item.quantity;
    }
    
    return sum + itemTotal;
  }, 0);
  
  const taxRate = 0.1;
  const taxAmount = total - (total / (1 + taxRate));
  const subtotal = total - taxAmount;
  
  const handleSeeOrder = () => {
    navigate('/order-summary', {
      state: {
        items,
        orderType,
        tableNumber,
        subtotal,
        taxAmount,
        total,
        taxIncluded: true
      }
    });
    onClose();
  };
  
  const containerClassName = "h-full flex flex-col bg-white";
  
  return (
    <div className={containerClassName}>
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Your Order</h2>
          {totalItems > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full px-2 py-0.5">
              {totalItems}
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {orderType === 'eat-in' && tableNumber && (
        <div className="px-6 py-3 bg-blue-50 flex items-center text-sm">
          <span className="font-medium text-blue-700">Table {tableNumber}</span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="text-gray-600">Eat In</span>
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-1">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add some delicious items to get started</p>
        </div>
      ) : (
        <>
          <div className={`${isMobile ? 'pb-[200px]' : ''} flex-1 overflow-y-auto p-6`}>
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <motion.div
                  key={`${item.product.id}-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <CartItem
                    item={item}
                    onRemove={() => onRemoveItem(index)}
                    onIncrement={() => onIncrementItem(index)}
                    onDecrement={() => onDecrementItem(index)}
                    isTablet={isMobile}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {isMobile ? (
            <div className="fixed inset-x-0 bottom-0 w-full max-w-[inherit] p-6 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] max-h-[180px] z-10">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA</span>
                  <span>{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>
              
              <Button size="full" onClick={handleSeeOrder} disabled={items.length === 0}>
                Voir Ma Commande
              </Button>
            </div>
          ) : (
            <div className="p-6 border-t border-gray-100">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TVA</span>
                  <span>{taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>
              
              <Button size="full" onClick={handleSeeOrder} disabled={items.length === 0}>
                Voir Ma Commande
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartSidebar;
