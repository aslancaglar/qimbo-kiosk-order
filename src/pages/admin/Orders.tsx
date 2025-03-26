
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
import { Search, Filter, Eye, RefreshCw } from "lucide-react";
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
import { Order } from '@/types/orders';
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { enableRealtimeForTables } from "@/utils/enableRealtimeForTables";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    // Enable realtime functionality for tables
    const setup = async () => {
      await enableRealtimeForTables();
    };
    setup();

    const channel = supabase
      .channel('orders-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Orders page detected order changes:', payload);
          
          // Show toast for new orders
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Order Received",
              description: `Order #${payload.new.id} has been created`,
            });
          }
          
          // Invalidate and refetch orders data
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
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
      
      console.log('Fetched orders:', data);
      return data as Order[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toString().includes(searchTerm) ||
      order.customer_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === null || 
      order.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
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
              onClick={() => refetch()}
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
              className={`cursor-pointer ${selectedStatus === null ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
              onClick={() => setSelectedStatus(null)}
            >
              All
            </Badge>
            <Badge 
              className={`cursor-pointer ${selectedStatus === 'in progress' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
              onClick={() => setSelectedStatus('in progress')}
            >
              In Progress
            </Badge>
            <Badge 
              className={`cursor-pointer ${selectedStatus === 'completed' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
              onClick={() => setSelectedStatus('completed')}
            >
              Completed
            </Badge>
            <Badge 
              className={`cursor-pointer ${selectedStatus === 'cancelled' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
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
            <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px] w-full">
              <div className="min-w-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
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
                    {filteredOrders.map((order) => (
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
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
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
