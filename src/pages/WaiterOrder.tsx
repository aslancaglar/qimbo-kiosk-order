
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, User, ArrowRight, Home } from 'lucide-react';
import { useMenuData } from '@/hooks/use-menu-data';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWaiterCart } from '@/hooks/use-waiter-cart';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import TableSelector from '@/components/common/TableSelector';
import { Product } from '@/components/menu/ProductCard';

const WaiterOrder: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { products, isLoading, categoryNames, categoryIcons } = useMenuData();
  const [activeCategory, setActiveCategory] = useState(categoryNames?.length > 0 ? categoryNames[0] : '');
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  
  const { 
    cartItems, 
    addItemToCart,
    removeItemFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
    clearCart,
    getTotalAmount,
    isCartEmpty
  } = useWaiterCart();

  // Update active category when categories are loaded
  React.useEffect(() => {
    if (categoryNames?.length > 0 && !activeCategory) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames, activeCategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handleTableSelect = (table: number) => {
    setTableNumber(table);
    setIsTableSelectorOpen(false);
    toast({
      title: "Table Selected",
      description: `Table #${table} has been selected`,
    });
  };

  const handleCheckout = () => {
    if (isCartEmpty()) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your order first",
        variant: "destructive"
      });
      return;
    }

    if (tableNumber === null) {
      setIsTableSelectorOpen(true);
      return;
    }

    navigate('/waiter-checkout', { 
      state: { 
        items: cartItems,
        orderType: 'eat-in',
        tableNumber,
        waiterOrder: true
      }
    });
  };

  const handleAddProduct = (product: Product) => {
    addItemToCart(product);
    toast({
      title: "Item Added",
      description: `${product.name} added to order`,
    });
  };

  const productsByCategory = (category: string) => {
    return products?.filter(product => {
      if (product.menu_categories?.name === category) return true;
      if (product.category === category) return true;
      return false;
    }) || [];
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b bg-white">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <h1 className="text-xl font-bold">Waiter Order</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsTableSelectorOpen(true)}
            className={tableNumber ? "bg-blue-50 text-blue-700" : ""}
          >
            <User className="mr-2 h-4 w-4" />
            {tableNumber ? `Table #${tableNumber}` : "Select Table"}
          </Button>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex p-2 space-x-2">
            {categoryNames?.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Product Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Products Column */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex justify-center p-8">Loading products...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productsByCategory(activeCategory).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">€{product.price.toFixed(2)}</p>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Order Summary Column - Only show on larger screens */}
          {!isMobile && (
            <div className="w-1/3 border-l bg-gray-50 p-4 flex flex-col">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              
              {cartItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  No items added yet
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1">
                    <div className="space-y-4">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">€{item.product.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => decrementItemQuantity(index)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => incrementItemQuantity(index)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500"
                              onClick={() => removeItemFromCart(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Total:</span>
                      <span className="font-bold">€{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1" onClick={() => clearCart()}>
                        Clear
                      </Button>
                      <Button className="flex-1" onClick={handleCheckout}>
                        Checkout
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Cart Button (Fixed at bottom) */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
            <Button 
              className="w-full" 
              disabled={isCartEmpty()}
              onClick={handleCheckout}
            >
              View Order ({cartItems.length} items) - €{getTotalAmount().toFixed(2)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mobile Cart Sheet */}
        <Sheet open={isTableSelectorOpen} onOpenChange={setIsTableSelectorOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Select Table</SheetTitle>
            </SheetHeader>
            <TableSelector onSelectTable={handleTableSelect} />
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
};

export default WaiterOrder;
