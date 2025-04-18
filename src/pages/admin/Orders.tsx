
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye, RefreshCw, Plus, Minus } from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, isValid } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem } from '@/types/orders';
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const ORDERS_PER_PAGE = 50;

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime subscription for orders page...');
    
    const channel = supabase
      .channel('orders-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Orders page detected order changes:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Order Received",
              description: `Order #${payload.new.id} has been created`,
            });
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Order Updated",
              description: `Order #${payload.new.id} status changed to ${payload.new.status}`,
            });
            
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Orders page subscription status:', status);
      });

    return () => {
      console.log('Cleaning up orders page subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders data...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Fetched orders data:', data);
      return data as Order[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000,
  });

  const { data: orderDetails, isLoading: isLoadingDetails, refetch: refetchDetails } = useQuery({
    queryKey: ['orderDetails', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return null;
      
      console.log(`Fetching details for order #${selectedOrder.id}...`);
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          menu_item_id,
          quantity,
          price,
          notes,
          menu_items:menu_item_id (id, name, category, price, status, has_toppings)
        `)
        .eq('order_id', selectedOrder.id);
      
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        toast({
          title: "Error fetching order items",
          description: itemsError.message,
          variant: "destructive",
        });
        throw itemsError;
      }
      
      const formattedItems: OrderItem[] = orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        menu_item: item.menu_items,
        toppings: []
      }));
      
      for (const item of formattedItems) {
        const { data: toppings, error: toppingsError } = await supabase
          .from('order_item_toppings')
          .select(`
            id,
            order_item_id,
            topping_id,
            price,
            toppings:topping_id (id, name, category, price, available)
          `)
          .eq('order_item_id', item.id);
          
        if (toppingsError) {
          console.error(`Error fetching toppings for item #${item.id}:`, toppingsError);
          continue;
        }
        
        item.toppings = toppings.map(t => ({
          id: t.id,
          order_item_id: t.order_item_id,
          topping_id: t.topping_id,
          price: t.price,
          topping: t.toppings
        }));
      }
      
      console.log('Fetched order details:', formattedItems);
      return formattedItems;
    },
    enabled: !!selectedOrder,
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toString().includes(searchTerm) ||
      order.customer_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === null || 
      order.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = Math.min(startIndex + ORDERS_PER_PAGE, totalOrders);
  
  // Current page orders
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of the table
      const tableElement = document.querySelector('.orders-table-container');
      if (tableElement) {
        tableElement.scrollTop = 0;
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        return 'Invalid date';
      }
      
      const date = new Date(dateString);
      
      if (!isValid(date)) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === now.toDateString()) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      console.log(`Updating order #${selectedOrder.id} status to ${newStatus}...`);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);
      
      if (error) throw error;
      
      toast({
        title: "Order Updated",
        description: `Order #${selectedOrder.id} status changed to ${newStatus}`,
      });
      
      setSelectedOrder({
        ...selectedOrder,
        status: newStatus
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Update Failed",
        description: "Could not update order status",
        variant: "destructive",
      });
    }
  };

  const handleManualRefresh = () => {
    console.log('Manually refreshing orders data...');
    refetch();
  };

  const getFilterBadgeClass = (isSelected: boolean) => {
    return `cursor-pointer ${isSelected 
      ? 'bg-[hsl(215_50%_23%)] text-white hover:bg-[hsl(215_50%_30%)]' 
      : 'bg-secondary hover:bg-[hsl(215_50%_30%)]'} transition-colors`;
  };

  const getStatusFilterBadgeClass = (badgeStatus: string | null, currentStatus: string | null) => {
    const isActive = badgeStatus === currentStatus;
    
    return `cursor-pointer ${isActive 
      ? 'bg-[hsl(215_50%_23%)] text-white' 
      : 'bg-[hsl(215_50%_40%)] text-white opacity-70'} hover:bg-[hsl(215_50%_30%)] hover:opacity-100 transition-colors`;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if at the ends
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pageNumbers.map(page => (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orders</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedStatus(null);
                setSearchTerm('');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              {selectedStatus ? `Filter: ${selectedStatus}` : 'All Orders'}
            </Button>
            <Button 
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="mr-2"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin animate-duration-[4s]' : ''}`} />
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search orders..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Badge 
              className={getStatusFilterBadgeClass(null, selectedStatus)}
              onClick={() => setSelectedStatus(null)}
            >
              All
            </Badge>
            <Badge 
              className={getStatusFilterBadgeClass('new', selectedStatus)}
              onClick={() => setSelectedStatus('new')}
            >
              New
            </Badge>
            <Badge 
              className={getStatusFilterBadgeClass('in progress', selectedStatus)}
              onClick={() => setSelectedStatus('in progress')}
            >
              In Progress
            </Badge>
            <Badge 
              className={getStatusFilterBadgeClass('completed', selectedStatus)}
              onClick={() => setSelectedStatus('completed')}
            >
              Completed
            </Badge>
            <Badge 
              className={getStatusFilterBadgeClass('cancelled', selectedStatus)}
              onClick={() => setSelectedStatus('cancelled')}
            >
              Cancelled
            </Badge>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Error loading orders. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        ) : (
          <div className="relative flex-1 overflow-hidden border rounded-md">
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px] w-full orders-table-container">
              <div className="min-w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          {order.customer_type === 'Table' 
                            ? `Table #${order.table_number}` 
                            : 'Takeaway'}
                        </TableCell>
                        <TableCell>{order.items_count}</TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            <div className="border-t bg-white p-2 flex justify-between items-center text-sm">
              <div className="text-muted-foreground">
                Showing {startIndex + 1}-{endIndex} of {totalOrders} orders
              </div>
              {renderPagination()}
            </div>
          </div>
        )}
        
        <Sheet open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Order #{selectedOrder?.id}</SheetTitle>
              <SheetDescription>
                {selectedOrder?.customer_type === 'Table' 
                  ? `Table #${selectedOrder.table_number}` 
                  : 'Takeaway'} · {selectedOrder ? formatDate(selectedOrder.created_at) : ''}
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="mb-4">
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${selectedOrder ? getStatusClass(selectedOrder.status) : ''}`}>
                  {selectedOrder?.status}
                </span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Order Summary</h3>
                  <p className="text-sm">Total Items: {selectedOrder?.items_count}</p>
                  <p className="text-sm">Total Amount: ${selectedOrder?.total_amount.toFixed(2)}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Order Items</h3>
                  
                  {isLoadingDetails ? (
                    <div className="py-4 flex justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : orderDetails && orderDetails.length > 0 ? (
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-4">
                        {orderDetails.map((item) => (
                          <div 
                            key={item.id} 
                            className="border rounded-md p-3 bg-background/50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {item.quantity}x {item.menu_item?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ${item.price.toFixed(2)}
                                </p>
                                {item.notes && (
                                  <p className="text-sm mt-1 italic text-muted-foreground">
                                    Note: {item.notes}
                                  </p>
                                )}
                              </div>
                              <p className="font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            
                            {item.toppings && item.toppings.length > 0 && (
                              <div className="mt-2 pl-4 border-l-2 border-muted">
                                <p className="text-xs text-muted-foreground mb-1">Toppings:</p>
                                <div className="space-y-1">
                                  {item.toppings.map((topping) => (
                                    <div key={topping.id} className="flex justify-between text-sm">
                                      <span>{topping.topping?.name}</span>
                                      <span>${topping.price.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No items found.</p>
                  )}
                </div>
                
                <Separator />
                
                <div className="text-xs text-center text-muted-foreground">
                  <p>All prices include 10% tax</p>
                </div>
                
                <Separator />
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant={selectedOrder?.status === 'New' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('New')}
                    >
                      New
                    </Button>
                    <Button 
                      size="sm" 
                      variant={selectedOrder?.status === 'In Progress' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('In Progress')}
                    >
                      In Progress
                    </Button>
                    <Button 
                      size="sm" 
                      variant={selectedOrder?.status === 'Completed' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Completed')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Completed
                    </Button>
                    <Button 
                      size="sm" 
                      variant={selectedOrder?.status === 'Cancelled' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('Cancelled')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Cancelled
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <Button variant="outline" asChild>
                    <SheetClose>Close</SheetClose>
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
};

export default Orders;
