
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/orders';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Bell, Clock, CheckCircle, Info, Plus, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { format, formatDistance } from 'date-fns';
import { NotificationSettingsModal } from '@/components/admin/NotificationSettingsModal';

// Sound notification for new orders
let notificationSound: HTMLAudioElement;

const KitchenDisplay = () => {
  const [columns, setColumns] = useState<{
    'New': Order[];
    'In Progress': Order[];
    'Completed': Order[];
  }>({
    'New': [],
    'In Progress': [],
    'Completed': [],
  });
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const queryClient = useQueryClient();
  const prevOrdersRef = useRef<Order[]>([]);
  
  // Initialize notification sound
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'kds_notification_settings')
          .maybeSingle();

        if (data && data.value) {
          const settings = data.value as Record<string, any>;
          setSoundEnabled(settings.enabled !== undefined ? settings.enabled : true);
          
          // Initialize sound with the saved URL or default
          const soundUrl = settings.soundUrl || '/notification.mp3';
          notificationSound = new Audio(soundUrl);
          
          // Preload the sound
          notificationSound.load();
        } else {
          // Default sound if no settings are saved
          notificationSound = new Audio('/notification.mp3');
          notificationSound.load();
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        // Use default sound on error
        notificationSound = new Audio('/notification.mp3');
        notificationSound.load();
      }
    };

    loadNotificationSettings();
  }, []);
  
  // Fetch all orders
  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      return data as Order[];
    },
    refetchInterval: 10000,
  });
  
  // Organize orders into columns based on status
  useEffect(() => {
    if (orders) {
      const newColumns = {
        'New': orders.filter(order => 
          order.status === 'New'
        ),
        'In Progress': orders.filter(order => order.status === 'In Progress'),
        'Completed': orders.filter(order => order.status === 'Completed'),
      };
      
      setColumns(newColumns);
      
      // Check for new orders to play sound
      if (prevOrdersRef.current.length > 0 && orders.length > prevOrdersRef.current.length) {
        const prevIds = new Set(prevOrdersRef.current.map(order => order.id));
        const newOrder = orders.find(order => !prevIds.has(order.id));
        
        if (newOrder) {
          toast.success(`New Order #${newOrder.id} Received!`, {
            description: `${newOrder.items_count} items - $${newOrder.total_amount.toFixed(2)}`,
          });
          
          // Play notification sound if enabled
          if (soundEnabled && notificationSound) {
            notificationSound.play().catch(e => {
              console.error('Failed to play notification sound:', e);
            });
          }
        }
      }
      
      prevOrdersRef.current = [...orders];
    }
  }, [orders, soundEnabled]);
  
  // Handle drag and drop between columns
  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    
    const orderId = parseInt(draggableId);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Determine new status based on destination column
    let newStatus = destination.droppableId;
    
    try {
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Optimistically update UI
      const sourceColumn = columns[source.droppableId as keyof typeof columns];
      const destColumn = columns[destination.droppableId as keyof typeof columns];
      
      const newSourceColumn = [...sourceColumn];
      const newDestColumn = [...destColumn];
      
      // Remove from source
      const [movedOrder] = newSourceColumn.splice(source.index, 1);
      
      // Insert at destination
      newDestColumn.splice(destination.index, 0, {
        ...movedOrder,
        status: newStatus
      });
      
      // Update columns state
      setColumns({
        ...columns,
        [source.droppableId]: newSourceColumn,
        [destination.droppableId]: newDestColumn
      });
      
      toast.success(`Order #${orderId} moved to ${destination.droppableId}`);
      
      // Invalidate the query to refetch
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };
  
  // Fetch order details for the modal
  const fetchOrderDetails = async (orderId: number) => {
    setIsLoadingDetails(true);
    try {
      // Fetch order items with menu item data
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
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;
      
      // Format the orderItems to match our types
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
      
      // For each order item, fetch its toppings
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
        
        // Map the toppings to our format
        item.toppings = toppings.map(t => ({
          id: t.id,
          order_item_id: t.order_item_id,
          topping_id: t.topping_id,
          price: t.price,
          topping: t.toppings
        }));
      }
      
      setOrderDetails(formattedItems);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Handle opening the order details modal
  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    fetchOrderDetails(order.id);
  };
  
  // Set up real-time listeners for order updates
  useEffect(() => {
    const channel = supabase
      .channel('kds-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Play notification sound for real-time new orders
            if (soundEnabled && notificationSound) {
              notificationSound.play().catch(e => console.error('Failed to play notification sound:', e));
            }
            
            toast.success(`New Order #${payload.new.id} Received!`, {
              description: `${payload.new.items_count} items - $${payload.new.total_amount.toFixed(2)}`,
            });
          }
          
          // Refetch orders to update the display
          queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, soundEnabled]);
  
  // Toggle notification button based on current state
  const renderSoundButton = () => {
    return (
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => setIsSettingsOpen(true)}
        title="Notification Settings"
      >
        {soundEnabled ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
    );
  };
  
  // Render the KDS columns
  const renderColumns = () => {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
          {Object.entries(columns).map(([columnId, columnOrders]) => (
            <div key={columnId} className="flex flex-col h-full">
              <div className={`mb-2 rounded-md p-2 font-semibold text-white ${
                columnId === 'New' ? 'bg-purple-600' : 
                columnId === 'In Progress' ? 'bg-amber-600' : 
                'bg-green-600'
              } flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                  {columnId === 'New' && <Plus size={18} />}
                  {columnId === 'In Progress' && <Clock size={18} />}
                  {columnId === 'Completed' && <CheckCircle size={18} />}
                  {columnId}
                </span>
                <Badge variant="outline" className="bg-white text-gray-800">
                  {columnOrders.length}
                </Badge>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-1 bg-gray-50 rounded-md p-2 overflow-hidden"
                  >
                    <ScrollArea className="h-full pr-2">
                      <div className="space-y-3 min-h-full">
                        {columnOrders.length === 0 ? (
                          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
                            No orders in this column
                          </div>
                        ) : (
                          columnOrders.map((order, index) => (
                            <Draggable
                              key={order.id.toString()}
                              draggableId={order.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleOpenOrderDetails(order)}
                                  className="border bg-card shadow-sm rounded-md p-3 hover:shadow-md cursor-pointer transition-shadow"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-semibold text-lg">Order #{order.id}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {order.customer_type === 'Table' ? 
                                          `Table #${order.table_number}` : 
                                          'Takeaway'}
                                      </p>
                                    </div>
                                    <Badge 
                                      variant={
                                        order.status === 'Completed' ? 'default' : 
                                        order.status === 'In Progress' ? 'secondary' : 
                                        'outline'
                                      }
                                    >
                                      {order.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Items:</span>
                                      <span className="font-medium">{order.items_count}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">Total:</span>
                                      <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(order.created_at), 'MMM d, h:mm a')} • 
                                    <span className="ml-1">
                                      {formatDistance(new Date(order.created_at), new Date(), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    );
  };
  
  // Render the order details modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;
    
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Order #{selectedOrder.id}</span>
              <Badge variant={
                selectedOrder.status === 'Completed' ? 'default' : 
                selectedOrder.status === 'In Progress' ? 'secondary' : 
                'outline'
              }>
                {selectedOrder.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedOrder.customer_type === 'Table' ? 
                `Table #${selectedOrder.table_number}` : 
                'Takeaway'} • {format(new Date(selectedOrder.created_at), 'MMM d, h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Card>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-base">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span>{selectedOrder.items_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">${selectedOrder.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDistance(new Date(selectedOrder.created_at), new Date(), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-base">Customer Info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{selectedOrder.customer_type}</span>
                      </div>
                      {selectedOrder.customer_type === 'Table' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Table Number:</span>
                          <span>{selectedOrder.table_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  {isLoadingDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : orderDetails.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No items found for this order
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderDetails.map((item) => (
                        <div key={item.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {item.quantity}x {item.menu_item?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${item.price.toFixed(2)} each
                              </p>
                              {item.notes && (
                                <p className="text-sm italic bg-muted p-1 rounded-sm mt-1">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                            <p className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="mt-2 border-t pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Toppings:</p>
                              <div className="pl-2 space-y-1">
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
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          
          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex gap-2">
              {selectedOrder.status === 'New' && (
                <Button 
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('orders')
                        .update({ status: 'In Progress' })
                        .eq('id', selectedOrder.id);
                      
                      if (error) throw error;
                      
                      setSelectedOrder({...selectedOrder, status: 'In Progress'});
                      toast.success(`Order #${selectedOrder.id} marked as In Progress`);
                      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
                    } catch (error) {
                      console.error('Failed to update order status:', error);
                      toast.error('Failed to update order status');
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Start Preparing
                </Button>
              )}
              
              {selectedOrder.status !== 'In Progress' && selectedOrder.status !== 'New' && (
                <Button 
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('orders')
                        .update({ status: 'In Progress' })
                        .eq('id', selectedOrder.id);
                      
                      if (error) throw error;
                      
                      setSelectedOrder({...selectedOrder, status: 'In Progress'});
                      toast.success(`Order #${selectedOrder.id} marked as In Progress`);
                      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
                    } catch (error) {
                      console.error('Failed to update order status:', error);
                      toast.error('Failed to update order status');
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Mark In Progress
                </Button>
              )}
              
              {selectedOrder.status !== 'Completed' && (
                <Button 
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('orders')
                        .update({ status: 'Completed' })
                        .eq('id', selectedOrder.id);
                      
                      if (error) throw error;
                      
                      setSelectedOrder({...selectedOrder, status: 'Completed'});
                      toast.success(`Order #${selectedOrder.id} marked as Completed`);
                      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
                    } catch (error) {
                      console.error('Failed to update order status:', error);
                      toast.error('Failed to update order status');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Completed
                </Button>
              )}
              
              {selectedOrder.status !== 'Cancelled' && (
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('orders')
                        .update({ status: 'Cancelled' })
                        .eq('id', selectedOrder.id);
                      
                      if (error) throw error;
                      
                      setSelectedOrder({...selectedOrder, status: 'Cancelled'});
                      toast.success(`Order #${selectedOrder.id} cancelled`);
                      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
                      setIsModalOpen(false);
                    } catch (error) {
                      console.error('Failed to cancel order:', error);
                      toast.error('Failed to cancel order');
                    }
                  }}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          <div className="flex gap-2">
            {renderSoundButton()}
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-semibold">Error loading orders</h3>
              <p className="text-muted-foreground">Please try refreshing the page</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          renderColumns()
        )}
        
        {renderOrderDetailsModal()}
        
        {/* Notification Settings Modal */}
        <NotificationSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => {
            setIsSettingsOpen(false);
            // Reload settings after closing the modal
            const loadSettings = async () => {
              try {
                const { data } = await supabase
                  .from('settings')
                  .select('*')
                  .eq('key', 'kds_notification_settings')
                  .maybeSingle();

                if (data && data.value) {
                  const settings = data.value as Record<string, any>;
                  setSoundEnabled(settings.enabled !== undefined ? settings.enabled : true);
                  
                  // Update the notification sound with the new URL if changed
                  if (settings.soundUrl && (!notificationSound || notificationSound.src !== settings.soundUrl)) {
                    notificationSound = new Audio(settings.soundUrl);
                    notificationSound.load();
                  }
                }
              } catch (error) {
                console.error('Error loading updated notification settings:', error);
              }
            };
            loadSettings();
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default KitchenDisplay;
