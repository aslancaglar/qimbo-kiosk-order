
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
import { Search, Plus, Edit, Trash } from "lucide-react";

const MenuItems = () => {
  // Mock menu items data - in a real app this would come from an API
  const menuItems = [
    { id: 1, name: "Cheeseburger", category: "Burgers", price: "$10.99", status: "Active" },
    { id: 2, name: "Chicken Wings", category: "Appetizers", price: "$12.50", status: "Active" },
    { id: 3, name: "Caesar Salad", category: "Salads", price: "$8.99", status: "Active" },
    { id: 4, name: "Margherita Pizza", category: "Pizza", price: "$14.99", status: "Active" },
    { id: 5, name: "French Fries", category: "Sides", price: "$4.99", status: "Active" },
    { id: 6, name: "Chocolate Cake", category: "Desserts", price: "$6.99", status: "Inactive" },
    { id: 7, name: "Soda", category: "Drinks", price: "$2.99", status: "Active" },
    { id: 8, name: "Fish & Chips", category: "Mains", price: "$15.99", status: "Inactive" },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search menu items..." 
            className="pl-8" 
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">#{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                      <Trash className="h-4 w-4" />
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

export default MenuItems;
