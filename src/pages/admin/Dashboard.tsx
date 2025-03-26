import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Users, ShoppingBag, DollarSign, RefreshCw } from "lucide-react";
import AdminLayout from '../../components/admin/AdminLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { Order } from '@/types/orders';
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const Dashboard = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for immediate updates
  useEffect(() => {
    console.log('Setting up dashboard real-time subscription...');
    
    const channel = supabase
      .channel('dashboard-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Dashboard detected order changes:', payload);
          
          // Show toast for new orders
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Order Received",
              description: `Order #${payload.new.id} has been created`,
            });
          }
          
          // Invalidate and refetch all dashboard data
          queryClient.invalidateQueries({ queryKey: ['dashboard-orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('Dashboard subscription status:', status);
      });

    return () => {
      console.log('Cleaning up dashboard subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch recent orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      console.log('Fetching dashboard orders...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching orders for dashboard:', error);
        throw error;
      }
      
      console.log('Dashboard fetched orders:', data);
      return data as Order[];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Fetch overall statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('Fetching dashboard statistics...');
      
      // Fetch total orders count
      const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (ordersError) {
        console.error('Error fetching total orders count:', ordersError);
        throw ordersError;
      }

      // Fetch total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount');
      
      if (revenueError) {
        console.error('Error fetching total revenue:', revenueError);
        throw revenueError;
      }
      
      const totalRevenue = revenueData.reduce((sum, order) => sum + order.total_amount, 0);

      // Fetch unique customers (using customer_type)
      const { data: tableCustomers, error: tableError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_type', 'Table');
      
      if (tableError) {
        console.error('Error fetching table customers:', tableError);
        throw tableError;
      }
      
      const { data: takeawayCustomers, error: takeawayError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_type', 'Takeaway');
      
      if (takeawayError) {
        console.error('Error fetching takeaway customers:', takeawayError);
        throw takeawayError;
      }

      // Fetch active menu items
      const { count: activeItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      
      if (itemsError) {
        console.error('Error fetching active items:', itemsError);
        throw itemsError;
      }

      console.log('Dashboard statistics fetched successfully');
      
      return {
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue || 0,
        tableCustomers: tableCustomers?.length || 0,
        takeawayCustomers: takeawayCustomers?.length || 0,
        activeItems: activeItems || 0
      };
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Prepare stats for display
  const displayStats = [
    {
      title: "Total Orders",
      value: isLoadingStats ? "Loading..." : stats?.totalOrders.toString() || "0",
      change: "+12%", // Note: This is still hardcoded. Could be calculated based on historical data
      icon: <ShoppingBag className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Revenue",
      value: isLoadingStats ? "Loading..." : `$${stats?.totalRevenue.toFixed(2) || "0.00"}`,
      change: "+8%",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Customers",
      value: isLoadingStats ? "Loading..." : `${(stats?.tableCustomers || 0) + (stats?.takeawayCustomers || 0)}`,
      change: "+6%",
      icon: <Users className="h-8 w-8 text-purple-500" />,
    },
    {
      title: "Active Items",
      value: isLoadingStats ? "Loading..." : stats?.activeItems.toString() || "0",
      change: "+3",
      icon: <BarChart className="h-8 w-8 text-orange-500" />,
    },
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, h:mm a');
    } catch {
      return 'Invalid date';
    }
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

  return (
    <AdminLayout>
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="space-y-6 pb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {displayStats.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-green-500">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Orders Panel */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Recent Orders</CardTitle>
                {isLoadingOrders && <RefreshCw size={16} className="animate-spin text-gray-400" />}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No recent orders found</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">
                            {order.customer_type === 'Table' 
                              ? `Table #${order.table_number}` 
                              : 'Takeaway'} • {formatDate(order.created_at)}
                          </p>
                        </div>
                        <Badge className={getStatusClass(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Popular Items Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Cheeseburger', 'Chicken Wings', 'Caesar Salad', 'Margherita Pizza', 'French Fries'].map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center text-gray-400">
                          #{i+1}
                        </div>
                        <p className="font-medium">{item}</p>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {Math.floor(Math.random() * 50) + 10} orders
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </AdminLayout>
  );
};

export default Dashboard;
