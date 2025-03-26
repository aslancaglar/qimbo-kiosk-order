
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Users, ShoppingBag, DollarSign, RefreshCw } from "lucide-react";
import AdminLayout from '../../components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { Order } from '@/types/orders';
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching orders for dashboard:', error);
        throw error;
      }
      
      return data as Order[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate stats from real data
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const tableCustomers = orders.filter(order => order.customer_type === 'Table').length;
  const takeawayCustomers = orders.filter(order => order.customer_type === 'Takeaway').length;

  // In a real app, this data would come from an API
  const stats = [
    {
      title: "Total Orders",
      value: isLoadingOrders ? "Loading..." : totalOrders.toString(),
      change: "+12%",
      icon: <ShoppingBag className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Revenue",
      value: isLoadingOrders ? "Loading..." : `$${totalRevenue.toFixed(2)}`,
      change: "+8%",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Customers",
      value: isLoadingOrders ? "Loading..." : `${tableCustomers + takeawayCustomers}`,
      change: "+6%",
      icon: <Users className="h-8 w-8 text-purple-500" />,
    },
    {
      title: "Active Items",
      value: "45",
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
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
    </AdminLayout>
  );
};

export default Dashboard;
