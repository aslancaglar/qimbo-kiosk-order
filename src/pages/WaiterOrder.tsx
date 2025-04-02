
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMenuData } from '@/hooks/use-menu-data';
import { Product } from '@/components/menu/ProductCard';
import { ToppingItem } from '@/components/cart/types';
import { Plus, Minus, ShoppingCart, User, ChevronRight, X, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import TableSelector from '@/components/common/TableSelector';
import { useProductSelection } from '@/hooks/use-product-selection';
import ProductToppingSelector from '@/components/waiter/ProductToppingSelector';

// Custom hook for waiter cart functionality
function useWaiterCart() {
  const [cartItems, setCartItems] = useState<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    toppings?: ToppingItem[];
  }[]>([]);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const { toast } = useToast();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('waiterCart');
    const savedTable = localStorage.getItem('waiterTable');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart', e);
      }
    }
    
    if (savedTable) {
      try {
        setTableNumber(JSON.parse(savedTable));
      } catch (e) {
        console.error('Failed to parse saved table', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('waiterCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save table to localStorage whenever it changes
  useEffect(() => {
    if (tableNumber !== null) {
      localStorage.setItem('waiterTable', JSON.stringify(tableNumber));
    }
  }, [tableNumber]);

  const addItem = (product: Product, selectedToppings?: ToppingItem[]) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => {
        // Check if item ID matches and topping selection matches
        if (item.id !== product.id) return false;
        
        // If neither item has toppings, they match
        if (!selectedToppings?.length && !item.toppings?.length) return true;
        
        // If only one has toppings, they don't match
        if ((selectedToppings?.length && !item.toppings?.length) || (!selectedToppings?.length && item.toppings?.length)) return false;
        
        // If toppings counts don't match, they don't match
        if (selectedToppings?.length !== item.toppings?.length) return false;
        
        // Compare each topping
        const allToppingsMatch = selectedToppings.every(selectedTopping => 
          item.toppings?.some(itemTopping => 
            itemTopping.id === selectedTopping.id && 
            itemTopping.quantity === selectedTopping.quantity
          )
        );
        
        return allToppingsMatch;
      });

      const newCart = [...prev];
      
      if (existingItemIndex !== -1) {
        // Increment existing item quantity
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1
        };
      } else {
        // Add new item
        newCart.push({
          id: product.id,
          name: product.name,
          price: product.price + (selectedToppings?.reduce((sum, topping) => sum + topping.price, 0) || 0),
          quantity: 1,
          toppings: selectedToppings
        });
      }
      
      toast({
        title: "Added to order",
        description: `${product.name} added to the order`,
      });
      
      return newCart;
    });
  };

  const removeItem = (index: number) => {
    setCartItems(prev => {
      const newCart = [...prev];
      
      if (newCart[index].quantity > 1) {
        // Decrement quantity
        newCart[index] = {
          ...newCart[index],
          quantity: newCart[index].quantity - 1
        };
      } else {
        // Remove item completely
        newCart.splice(index, 1);
      }
      
      return newCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('waiterCart');
    setTableNumber(null);
    localStorage.removeItem('waiterTable');
    toast({
      title: "Order cleared",
      description: "The order has been cleared",
    });
  };

  const setTable = (number: number) => {
    setTableNumber(number);
    setIsTableSelectorOpen(false);
    toast({
      title: "Table selected",
      description: `Table ${number} selected`,
    });
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cartItems,
    tableNumber,
    isTableSelectorOpen,
    setIsTableSelectorOpen,
    addItem,
    removeItem,
    clearCart,
    setTable,
    totalItems,
    totalPrice
  };
}

const WaiterOrder: React.FC = () => {
  const { products, categories, categoryIcons, isLoading } = useMenuData();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    cartItems,
    tableNumber,
    isTableSelectorOpen,
    setIsTableSelectorOpen,
    addItem,
    removeItem,
    clearCart,
    setTable,
    totalItems,
    totalPrice
  } = useWaiterCart();

  const {
    isSelectionOpen,
    setIsSelectionOpen,
    isLoading: isToppingsLoading,
    toppingCategories,
    currentProduct,
    openProductSelection,
    closeProductSelection,
    completeSelection
  } = useProductSelection(addItem);

  // Set initial active category once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && activeCategory === "") {
      // Access the 'name' property of the first category
      setActiveCategory(categories[0]?.name || "");
    }
  }, [categories, activeCategory]);

  // Filter products based on active category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "" || product.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleProductSelect = (product: Product) => {
    if (product.hasToppings) {
      openProductSelection(product);
    } else {
      addItem(product);
    }
  };

  const handleTableSelection = (tableNumber: number) => {
    setTable(tableNumber);
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty order",
        description: "Please add items to the order",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate a simple order number (timestamp + random digits)
      const orderNumber = `W${Date.now().toString().substring(8)}${Math.floor(Math.random() * 1000)}`;
      
      // Insert order into database with all required fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_type: 'Dine-in',
          table_number: tableNumber || null,
          status: 'New',
          total_amount: totalPrice,
          items_count: totalItems,
          order_number: orderNumber
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItemPromises = cartItems.map(async (item) => {
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            menu_item_id: parseInt(item.id),
            quantity: item.quantity,
            price: item.price,
            notes: null
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // If item has toppings, insert them
        if (item.toppings && item.toppings.length > 0) {
          const toppingPromises = item.toppings.map(topping => {
            return supabase
              .from('order_item_toppings')
              .insert({
                order_item_id: orderItem.id,
                topping_id: topping.id,
                price: topping.price
              });
          });

          await Promise.all(toppingPromises);
        }

        return orderItem;
      });

      await Promise.all(orderItemPromises);

      // Clear cart after successful order
      clearCart();

      // Show success toast
      toast({
        title: "Order submitted",
        description: tableNumber ? `Order placed for table ${tableNumber}` : "Order placed successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order failed",
        description: "There was an error submitting the order",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="bg-red-600 text-white py-4 px-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Waiter Order</h1>
        <div className="flex items-center gap-2">
          {tableNumber ? (
            <button 
              className="flex items-center gap-1 p-1 px-2 bg-white/20 rounded"
              onClick={() => setIsTableSelectorOpen(true)}
            >
              <Table className="w-4 h-4" />
              <span>Table {tableNumber}</span>
            </button>
          ) : (
            <button 
              className="flex items-center gap-1 p-1 px-2 bg-white/20 rounded"
              onClick={() => setIsTableSelectorOpen(true)}
            >
              <Table className="w-4 h-4" />
              <span>Select Table (Optional)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Desktop Categories sidebar */}
        <ScrollArea className="hidden md:block w-32 border-r border-gray-200">
          <div className="p-2 space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  activeCategory === category.name
                    ? "bg-red-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile Categories horizontal scroll */}
          <div className="md:hidden overflow-x-auto whitespace-nowrap border-b border-gray-200 px-2">
            <div className="inline-flex py-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeCategory === category.name
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search menu..."
                className="w-full p-2 border rounded-lg mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-md mb-2"
                      />
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold">{product.price.toFixed(2)} €</span>
                        <button 
                          className={`text-white p-1 rounded-full ${product.hasToppings ? 'bg-green-600' : 'bg-red-600'}`}
                          onClick={() => handleProductSelect(product)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No products found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Cart summary */}
      {cartItems.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4 max-h-48 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.name}</span>
                  </div>
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="ml-6 text-xs text-gray-500">
                      {item.toppings.map((topping, i) => (
                        <div key={i}>{topping.name} ({topping.quantity}x)</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{(item.price * item.quantity).toFixed(2)} €</span>
                  <button 
                    onClick={() => removeItem(index)}
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">{totalItems} items</div>
              <div className="font-bold">Total: {totalPrice.toFixed(2)} €</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={clearCart}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                Clear
              </button>
              <button 
                onClick={submitOrder}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium"
              >
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table selector dialog */}
      {isTableSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <TableSelector 
            onSelectTable={handleTableSelection} 
            onCancel={() => setIsTableSelectorOpen(false)}
          />
        </div>
      )}

      {/* Product topping selector */}
      <AnimatePresence>
        {isSelectionOpen && currentProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <ProductToppingSelector
              product={currentProduct}
              toppingCategories={toppingCategories}
              isLoading={isToppingsLoading}
              onCancel={closeProductSelection}
              onConfirm={completeSelection}
            />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WaiterOrder;
