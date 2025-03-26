
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Users, ShoppingBag, DollarSign } from "lucide-react";
import AdminLayout from '../../components/admin/AdminLayout';

const Dashboard = () => {
  // In a real app, this data would come from an API
  const stats = [
    {
      title: "Total Orders",
      value: "156",
      change: "+12%",
      icon: <ShoppingBag className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Revenue",
      value: "$5,429",
      change: "+8%",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Customers",
      value: "89",
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
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">Order #{1000 + i}</p>
                      <p className="text-sm text-gray-500">Table #3 • 10 mins ago</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Completed
                    </span>
                  </div>
                ))}
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
