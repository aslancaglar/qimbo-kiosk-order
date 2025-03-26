
import React, { useState, useEffect } from 'react';
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
  DialogClose,
  DialogDescription
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: string;
  status: "Active" | "Inactive";
  hasToppings: boolean;
  availableToppingCategories?: number[];
}

interface ToppingCategory {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  description: string;
  required: boolean;
}

const menuItemFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  price: z.string().min(1, { message: "Price is required." }),
  status: z.enum(["Active", "Inactive"]),
  hasToppings: z.boolean().default(false),
  availableToppingCategories: z.array(z.number()).optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const { toast } = useToast();
  
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      status: "Active",
      hasToppings: false,
      availableToppingCategories: [],
    },
  });

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      const transformedItems: MenuItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: `$${item.price}`,
        status: item.status as "Active" | "Inactive",
        hasToppings: item.has_toppings,
        availableToppingCategories: item.available_topping_categories || []
      }));
      
      setMenuItems(transformedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchToppingCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('topping_categories')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      const transformedCategories: ToppingCategory[] = data.map(category => ({
        id: category.id,
        name: category.name,
        minSelection: category.min_selection,
        maxSelection: category.max_selection,
        description: category.description || '',
        required: category.required
      }));
      
      setToppingCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching topping categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topping categories. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  useEffect(() => {
    fetchMenuItems();
    fetchToppingCategories();
    
    const channel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenuItems();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
      availableToppingCategories: item.availableToppingCategories || [],
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
      availableToppingCategories: [],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully.',
      });
      
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: MenuItemFormValues) => {
    try {
      const priceValue = parseFloat(data.price.replace('$', ''));
      
      if (isNaN(priceValue)) {
        toast({
          title: 'Error',
          description: 'Invalid price format. Please enter a valid number.',
          variant: 'destructive',
        });
        return;
      }
      
      const menuItemData = {
        name: data.name,
        category: data.category,
        price: priceValue,
        status: data.status,
        has_toppings: data.hasToppings,
        available_topping_categories: data.hasToppings ? data.availableToppingCategories : []
      };
      
      if (editItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editItem.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Menu item updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([menuItemData]);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Menu item added successfully.',
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="h-full flex flex-col space-y-6 overflow-hidden">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-hidden rounded-md border">
          <ScrollArea className="h-[calc(100vh-240px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
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
                            Has Toppings: {item.availableToppingCategories?.length || 0} categories
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No menu items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {editItem ? 'update' : 'add'} a menu item.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-1">
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
                      name="availableToppingCategories"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="text-base">Available Topping Categories</FormLabel>
                            <FormDescription>
                              Select which topping categories can be added to this item
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {toppingCategories.map((category) => (
                              <FormField
                                key={category.id}
                                control={form.control}
                                name="availableToppingCategories"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={category.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(category.id)}
                                          onCheckedChange={(checked) => {
                                            const current = Array.isArray(field.value) ? field.value : []
                                            return checked
                                              ? field.onChange([...current, category.id])
                                              : field.onChange(
                                                  current.filter((value) => value !== category.id)
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          {category.name}
                                        </FormLabel>
                                        <FormDescription>
                                          {category.description}
                                          {category.required && (
                                            <span className="text-red-500 ml-1 font-medium">
                                              (Required)
                                            </span>
                                          )}
                                        </FormDescription>
                                        <FormDescription>
                                          Min: {category.minSelection} / Max: {category.maxSelection} selections
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default MenuItems;
