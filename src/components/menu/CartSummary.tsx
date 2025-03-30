import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Trash, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import { CartItemType } from '../cart/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
interface CartSummaryProps {
  cartItems: CartItemType[];
  onRemoveItem: (index: number) => void;
  onIncrementItem: (index: number) => void;
  onDecrementItem: (index: number) => void;
  onCancelOrderClick: () => void;
  onConfirmOrder: () => Promise<void>;
  orderType: 'takeaway' | 'eat-in';
  tableNumber?: number;
}
const CartSummary: React.FC<CartSummaryProps> = ({
  cartItems,
  onRemoveItem,
  onIncrementItem,
  onDecrementItem,
  onCancelOrderClick,
  onConfirmOrder,
  orderType,
  tableNumber
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => {
    let itemTotal = item.product.price * item.quantity;
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      const toppingsPrice = item.selectedToppings.reduce((toppingSum, topping) => toppingSum + topping.price, 0);
      itemTotal += toppingsPrice * item.quantity;
    }
    return sum + itemTotal;
  }, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const handleSeeOrder = () => {
    navigate('/order-summary', {
      state: {
        items: cartItems,
        orderType,
        tableNumber,
        subtotal,
        tax,
        total
      }
    });
  };
  return <motion.div initial={{
    y: 300
  }} animate={{
    y: 0
  }} exit={{
    y: 300,
    opacity: 0
  }} transition={{
    duration: 0.3,
    ease: "easeInOut"
  }} className="bg-white border-t border-gray-200 shadow-lg pb-[80px]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold">VOTRE COMMANDE ({totalItems})</h2>
          </div>
        </div>
        
        {cartItems.length > 0 && <div className="mb-4 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {cartItems.map((item, index) => <motion.div key={`${item.product.id}-${index}`} className="flex items-center justify-between py-2 border-b" initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.3
          }} layout>
                  <div className="flex items-center">
                    {!isMobile && window.innerWidth >= 1025 && <img src={item.product.image} alt={item.product.name} className="h-12 w-12 object-cover rounded mr-3" />}
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.product.price.toFixed(2)} €
                        {item.quantity > 1 && !isMobile && window.innerWidth < 1025 && ` × ${item.quantity}`}
                      </p>
                      
                      {item.selectedToppings && item.selectedToppings.length > 0 && <div className="text-xs text-gray-500 mt-1">
                          {item.selectedToppings.map(topping => <span key={topping.id} className="mr-1">
                              +{topping.name} ({topping.price.toFixed(2)} €)
                            </span>)}
                        </div>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isMobile || window.innerWidth >= 1025 ? <>
                        <button onClick={() => onDecrementItem(index)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200" disabled={item.quantity <= 1}>
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => onIncrementItem(index)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                          <Plus className="h-4 w-4" />
                        </button>
                      </> : <button onClick={() => onRemoveItem(index)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 ml-2">
                        <Trash className="h-4 w-4 text-red-500" />
                      </button>}
                    
                    {(isMobile || window.innerWidth >= 1025) && <button onClick={() => onRemoveItem(index)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 ml-2">
                        <Trash className="h-4 w-4 text-red-500" />
                      </button>}
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </div>}
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 text-sm">Sous-total:</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 text-sm">TVA (10%):</span>
          <span>{tax.toFixed(2)} €</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">TOTAL:</span>
          <span className="font-bold text-xl">{total.toFixed(2)} €</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancelOrderClick} className="bg-red-600 hover:bg-red-700 text-white">
            Annuler
          </Button>
          <Button onClick={handleSeeOrder} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right" className="text-white bg-green-800 hover:bg-green-700">
            Voir Ma Commande
          </Button>
        </div>
      </div>
    </motion.div>;
};
export default CartSummary;