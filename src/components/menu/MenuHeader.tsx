
import React from 'react';
import { Home, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

interface MenuHeaderProps {
  title?: string;
  showCartIcon?: boolean;
  cartItemsCount?: number;
  onCartClick?: () => void;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ 
  title = "Menu",
  showCartIcon = false,
  cartItemsCount = 0,
  onCartClick
}) => {
  const navigate = useNavigate();

  return (
    <header className="flex justify-between items-center p-4 bg-red-600 text-white">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/')}
        className="rounded-full text-white hover:bg-red-700"
      >
        <Home size={24} />
      </Button>
      
      <h1 className="text-2xl font-bebas tracking-wider">{title}</h1>
      
      {showCartIcon ? (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCartClick}
          className="rounded-full text-white hover:bg-red-700 relative"
        >
          <ShoppingCart size={24} />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </Button>
      ) : (
        <div className="w-10"></div>
      )}
    </header>
  );
};

export default MenuHeader;
