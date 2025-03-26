
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../layout/Layout';
import CategorySelector from './CategorySelector';
import ProductCard, { Product } from './ProductCard';
import CartSidebar, { CartItemType } from '../cart/CartSidebar';
import Button from '../common/Button';
import { ShoppingBag, Home } from 'lucide-react';

// Mock data - in a real app this would come from an API
const MOCK_CATEGORIES = ['All', 'Appetizers', 'Main Courses', 'Drinks', 'Desserts'];

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce on a brioche bun',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Main Courses',
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with creamy Caesar dressing, parmesan, and croutons',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Appetizers',
  },
  {
    id: '3',
    name: 'Fresh Lemonade',
    description: 'Freshly squeezed lemons with a hint of mint and honey',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1621417719197-3e52d2e42dbf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Drinks',
  },
  {
    id: '4',
    name: 'Chocolate Brownie',
    description: 'Rich chocolate brownie with vanilla ice cream and caramel sauce',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Desserts',
  },
  {
    id: '5',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, fresh mozzarella, and basil',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Main Courses',
  },
  {
    id: '6',
    name: 'French Fries',
    description: 'Crispy golden fries served with ketchup and aioli',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Appetizers',
  },
  {
    id: '7',
    name: 'Iced Coffee',
    description: 'Cold brew coffee with your choice of milk and sweetener',
    price: 4.49,
    image: 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Drinks',
  },
  {
    id: '8',
    name: 'Cheesecake',
    description: 'Creamy New York style cheesecake with berry compote',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    category: 'Desserts',
  },
];

const MenuPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderType, tableNumber } = location.state || {};
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Redirect to welcome page if no orderType is specified
  useEffect(() => {
    if (!orderType) {
      navigate('/');
    }
  }, [orderType, navigate]);
  
  const filteredProducts = activeCategory === 'All'
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter(product => product.category === activeCategory);
  
  const handleProductSelect = (product: Product) => {
    const newItem: CartItemType = {
      product,
      quantity: 1,
    };
    
    setCartItems([...cartItems, newItem]);
    setIsCartOpen(true);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };
  
  const handleIncrementItem = (index: number) => {
    const newItems = [...cartItems];
    newItems[index].quantity += 1;
    setCartItems(newItems);
  };
  
  const handleDecrementItem = (index: number) => {
    const newItems = [...cartItems];
    if (newItems[index].quantity > 1) {
      newItems[index].quantity -= 1;
      setCartItems(newItems);
    }
  };
  
  return (
    <Layout>
      <header className="flex justify-between items-center p-6 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
          className="rounded-full"
        >
          <Home size={24} />
        </Button>
        
        <h1 className="text-2xl font-semibold">Menu</h1>
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCartOpen(true)}
            className="rounded-full"
          >
            <ShoppingBag size={24} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </header>
      
      <CategorySelector 
        categories={MOCK_CATEGORIES} 
        activeCategory={activeCategory} 
        onChange={setActiveCategory} 
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onSelect={handleProductSelect} 
            />
          ))}
        </div>
      </div>
      
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems} 
        onRemoveItem={handleRemoveItem}
        onIncrementItem={handleIncrementItem}
        onDecrementItem={handleDecrementItem}
        orderType={orderType}
        tableNumber={tableNumber}
      />
    </Layout>
  );
};

export default MenuPage;
