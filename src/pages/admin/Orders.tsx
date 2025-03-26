
import React from 'react';
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
import { Search, Filter } from "lucide-react";

const Orders = () => {
  // Mock orders data - in a real app this would come from an API
  const orders = [
    { id: 1001, customer: "Takeaway", items: 3, total: "$32.50", status: "Completed", time: "Today, 10:23 AM" },
    { id: 1002, customer: "Table #4", items: 6, total: "$78.95", status: "In Progress", time: "Today, 11:47 AM" },
    { id: 1003, customer: "Takeaway", items: 2, total: "$18.20", status: "Completed", time: "Today, 12:05 PM" },
    { id: 1004, customer: "Table #2", items: 4, total: "$45.30", status: "Completed", time: "Today, 1:30 PM" },
    { id: 1005, customer: "Takeaway", items: 1, total: "$12.99", status: "Cancelled", time: "Today, 2:15 PM" },
    { id: 1006, customer: "Table #6", items: 5, total: "$52.75", status: "In Progress", time: "Today, 3:20 PM" },
    { id: 1007, customer: "Takeaway", items: 3, total: "$29.40", status: "Completed", time: "Yesterday, 6:45 PM" },
    { id: 1008, customer: "Table #1", items: 7, total: "$86.10", status: "Completed", time: "Yesterday, 7:30 PM" },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search orders..." 
            className="pl-8" 
          />
        </div>
        
        <div className="rounded-md border">
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{order.time}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
