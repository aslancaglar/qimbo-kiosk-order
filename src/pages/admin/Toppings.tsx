import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define the Topping interface
interface Topping {
  id: number;
  name: string;
  price: number;
  available: boolean;
  category: string;
}

// Mock toppings data - in a real app this would come from an API
const mockToppings: Topping[] = [
  { id: 1, name: "Cheese", price: 1.50, available: true, category: "Dairy" },
  { id: 2, name: "Pepperoni", price: 2.00, available: true, category: "Meat" },
  { id: 3, name: "Mushrooms", price: 1.00, available: true, category: "Vegetables" },
  { id: 4, name: "Onions", price: 0.75, available: true, category: "Vegetables" },
  { id: 5, name: "Bacon", price: 2.50, available: true, category: "Meat" },
  { id: 6, name: "Extra Sauce", price: 0.50, available: true, category: "Sauces" },
  { id: 7, name: "Jalapeños", price: 1.00, available: true, category: "Vegetables" },
  { id: 8, name: "Pineapple", price: 1.25, available: false, category: "Fruits" },
];

// Form schema for topping validation
const toppingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  category: z.string().min(2, { message: "Category must be at least 2 characters." }),
  available: z.boolean().default(true),
});

type ToppingFormValues = z.infer<typeof toppingFormSchema>;

const Toppings = () => {
  const [toppings, setToppings] = useState<Topping[]>(mockToppings);
  const [editTopping, setEditTopping] = useState<Topping | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const form = useForm<ToppingFormValues>({
    resolver: zodResolver(toppingFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      category: "",
      available: true,
    },
  });

  const handleEditTopping = (topping: Topping) => {
    setEditTopping(topping);
    form.reset({
      name: topping.name,
      price: topping.price,
      category: topping.category,
      available: topping.available,
    });
    setIsAddDialogOpen(true);
  };

  const handleAddTopping = () => {
    setEditTopping(null);
    form.reset({
      name: "",
      price: 0,
      category: "",
      available: true,
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteTopping = (id: number) => {
    setToppings(toppings.filter(topping => topping.id !== id));
  };

  const onSubmit = (data: ToppingFormValues) => {
    if (editTopping) {
      // Update existing topping
      setToppings(toppings.map(t => 
        t.id === editTopping.id ? { 
          ...t, 
          name: data.name,
          price: data.price,
          category: data.category,
          available: data.available
        } : t
      ));
    } else {
      // Add new topping
      const newTopping: Topping = {
        id: Math.max(0, ...toppings.map(t => t.id)) + 1,
        name: data.name,
        price: data.price,
        category: data.category,
        available: data.available
      };
      setToppings([...toppings, newTopping]);
    }
    setIsAddDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Toppings</h1>
          <Button onClick={handleAddTopping}>
            <Plus className="mr-2 h-4 w-4" />
            Add Topping
          </Button>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search toppings..." 
            className="pl-8" 
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toppings.map((topping) => (
                <TableRow key={topping.id}>
                  <TableCell className="font-medium">#{topping.id}</TableCell>
                  <TableCell>{topping.name}</TableCell>
                  <TableCell>${topping.price.toFixed(2)}</TableCell>
                  <TableCell>{topping.category}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${topping.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {topping.available ? 'Available' : 'Unavailable'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditTopping(topping)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTopping(topping.id)}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTopping ? 'Edit Topping' : 'Add New Topping'}</DialogTitle>
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
                      <Input placeholder="Cheese, Bacon, etc." {...field} />
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
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                      <Input placeholder="Meat, Vegetables, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editTopping ? 'Update' : 'Add'} Topping</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Toppings;
