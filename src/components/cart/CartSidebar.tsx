
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import CartItem from './CartItem';
import { CartItemType } from './types';
import { ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax rate
  const total = subtotal + tax;
  
  const handleCheckout = () => {
    // Navigate to confirmation page with cart items
    navigate('/confirmation', { 
      state: { 
        items, 
        orderType, 
        tableNumber,
        subtotal,
        tax,
        total
      } 
    });
  };
  
  return (
    <>
      {/* Fixed position cart sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[350px] bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
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
            
            <button
              className="text-gray-500 hover:text-gray-900 p-2 -m-2"
              onClick={onClose}
            >
              <X size={24} />
            </button>
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
              <Button variant="outline" onClick={onClose}>
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <CartItem
                      key={`${item.product.id}-${index}`}
                      item={item}
                      onRemove={() => onRemoveItem(index)}
                      onIncrement={() => onIncrementItem(index)}
                      onDecrement={() => onDecrementItem(index)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button size="full" onClick={handleCheckout}>
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Overlay that only appears when cart is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default CartSidebar;
