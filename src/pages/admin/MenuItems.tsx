import React, { useState } from 'react';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: string;
  status: "Active" | "Inactive";
  hasToppings: boolean;
  availableToppings?: number[];
}

const initialMenuItems: MenuItem[] = [
  { id: 1, name: "Cheeseburger", category: "Burgers", price: "$10.99", status: "Active", hasToppings: true, availableToppings: [] },
  { id: 2, name: "Chicken Wings", category: "Appetizers", price: "$12.50", status: "Active", hasToppings: false, availableToppings: [] },
  { id: 3, name: "Caesar Salad", category: "Salads", price: "$8.99", status: "Active", hasToppings: false, availableToppings: [] },
  { id: 4, name: "Margherita Pizza", category: "Pizza", price: "$14.99", status: "Active", hasToppings: true, availableToppings: [] },
  { id: 5, name: "French Fries", category: "Sides", price: "$4.99", status: "Active", hasToppings: false, availableToppings: [] },
  { id: 6, name: "Chocolate Cake", category: "Desserts", price: "$6.99", status: "Inactive", hasToppings: false, availableToppings: [] },
  { id: 7, name: "Soda", category: "Drinks", price: "$2.99", status: "Active", hasToppings: false, availableToppings: [] },
  { id: 8, name: "Fish & Chips", category: "Mains", price: "$15.99", status: "Inactive", hasToppings: false, availableToppings: [] },
];

const mockToppings = [
  { id: 1, name: "Cheese", price: 1.50, available: true, category: "Dairy" },
  { id: 2, name: "Pepperoni", price: 2.00, available: true, category: "Meat" },
  { id: 3, name: "Mushrooms", price: 1.00, available: true, category: "Vegetables" },
  { id: 4, name: "Onions", price: 0.75, available: true, category: "Vegetables" },
  { id: 5, name: "Bacon", price: 2.50, available: true, category: "Meat" },
  { id: 6, name: "Extra Sauce", price: 0.50, available: true, category: "Sauces" },
  { id: 7, name: "Jalapeños", price: 1.00, available: true, category: "Vegetables" },
  { id: 8, name: "Pineapple", price: 1.25, available: false, category: "Fruits" },
];

const menuItemFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  price: z.string().min(1, { message: "Price is required." }),
  status: z.enum(["Active", "Inactive"]),
  hasToppings: z.boolean().default(false),
  availableToppings: z.array(z.number()).optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      status: "Active",
      hasToppings: false,
      availableToppings: [],
    },
  });

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

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item);
    form.reset({
      name: item.name,
      category: item.category,
      price: item.price.replace('$', ''),
      status: item.status,
      hasToppings: item.hasToppings,
      availableToppings: item.availableToppings || [],
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setEditItem(null);
    form.reset({
      name: "",
      category: "",
      price: "",
      status: "Active",
      hasToppings: false,
      availableToppings: [],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const onSubmit = (data: MenuItemFormValues) => {
    const formattedPrice = data.price.startsWith('$') ? data.price : `$${data.price}`;
    
    if (editItem) {
      setMenuItems(menuItems.map(item => 
        item.id === editItem.id ? { 
          ...item, 
          name: data.name,
          category: data.category,
          price: formattedPrice,
          status: data.status,
          hasToppings: data.hasToppings,
          availableToppings: data.hasToppings ? data.availableToppings || [] : []
        } : item
      ));
    } else {
      const newItem: MenuItem = {
        id: Math.max(0, ...menuItems.map(item => item.id)) + 1,
        name: data.name,
        category: data.category,
        price: formattedPrice,
        status: data.status,
        hasToppings: data.hasToppings,
        availableToppings: data.hasToppings ? data.availableToppings || [] : []
      };
      setMenuItems([...menuItems, newItem]);
    }
    
    setIsDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <Button onClick={handleAddItem}>
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
                <TableHead>Toppings</TableHead>
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
                  <TableCell>
                    {item.hasToppings ? (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Has Toppings
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditItem(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Burgers, Salads" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <div className="flex gap-4">
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="radio"
                            value="Active"
                            checked={field.value === "Active"}
                            onChange={() => field.onChange("Active")}
                            className="text-primary"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Active</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="radio"
                            value="Inactive"
                            checked={field.value === "Inactive"}
                            onChange={() => field.onChange("Inactive")}
                            className="text-primary"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">Inactive</FormLabel>
                      </FormItem>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasToppings"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Allow Toppings</FormLabel>
                      <FormDescription>
                        Enable this to allow customers to add toppings to this item
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("hasToppings") && (
                <FormField
                  control={form.control}
                  name="availableToppings"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Available Toppings</FormLabel>
                        <FormDescription>
                          Select which toppings can be added to this item
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockToppings.map((topping) => (
                          <FormField
                            key={topping.id}
                            control={form.control}
                            name="availableToppings"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={topping.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(topping.id)}
                                      onCheckedChange={(checked) => {
                                        const current = Array.isArray(field.value) ? field.value : []
                                        return checked
                                          ? field.onChange([...current, topping.id])
                                          : field.onChange(
                                              current.filter((value) => value !== topping.id)
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {topping.name}
                                    </FormLabel>
                                    <FormDescription>
                                      ${topping.price.toFixed(2)} - {topping.category}
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editItem ? 'Update' : 'Add'} Menu Item</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MenuItems;
