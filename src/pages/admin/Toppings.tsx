
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
import { Search, Plus, Edit, Trash, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define the ToppingCategory interface
interface ToppingCategory {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  description: string;
  required: boolean;
}

// Define the Topping interface
interface Topping {
  id: number;
  name: string;
  price: number;
  available: boolean;
  categoryId: number;
  maxQuantity: number;
}

// Initial mock data for topping categories
const mockCategories: ToppingCategory[] = [
  { 
    id: 1, 
    name: "Sauces", 
    minSelection: 1, 
    maxSelection: 2, 
    description: "Choose your favorite sauce", 
    required: true 
  },
  { 
    id: 2, 
    name: "Vegetables", 
    minSelection: 0, 
    maxSelection: 5, 
    description: "Add some veggies", 
    required: false 
  },
  { 
    id: 3, 
    name: "Cheese", 
    minSelection: 0, 
    maxSelection: 3, 
    description: "Extra cheese options", 
    required: false 
  },
  { 
    id: 4, 
    name: "Meat", 
    minSelection: 0, 
    maxSelection: 3, 
    description: "Premium meat toppings", 
    required: false 
  }
];

// Initial mock data for toppings based on categories
const mockToppings: Topping[] = [
  // Sauces
  { id: 1, name: "Tomato Sauce", price: 0.50, available: true, categoryId: 1, maxQuantity: 1 },
  { id: 2, name: "BBQ Sauce", price: 0.75, available: true, categoryId: 1, maxQuantity: 1 },
  { id: 3, name: "Ranch", price: 0.75, available: true, categoryId: 1, maxQuantity: 1 },
  { id: 4, name: "Hot Sauce", price: 0.50, available: true, categoryId: 1, maxQuantity: 1 },
  
  // Vegetables
  { id: 5, name: "Mushrooms", price: 1.00, available: true, categoryId: 2, maxQuantity: 2 },
  { id: 6, name: "Onions", price: 0.75, available: true, categoryId: 2, maxQuantity: 2 },
  { id: 7, name: "Bell Peppers", price: 0.75, available: true, categoryId: 2, maxQuantity: 2 },
  { id: 8, name: "Jalapeños", price: 1.00, available: true, categoryId: 2, maxQuantity: 2 },
  { id: 9, name: "Olives", price: 0.75, available: true, categoryId: 2, maxQuantity: 2 },
  
  // Cheese
  { id: 10, name: "Mozzarella", price: 1.50, available: true, categoryId: 3, maxQuantity: 2 },
  { id: 11, name: "Cheddar", price: 1.50, available: true, categoryId: 3, maxQuantity: 2 },
  { id: 12, name: "Parmesan", price: 1.75, available: true, categoryId: 3, maxQuantity: 2 },
  
  // Meat
  { id: 13, name: "Pepperoni", price: 2.00, available: true, categoryId: 4, maxQuantity: 3 },
  { id: 14, name: "Bacon", price: 2.50, available: true, categoryId: 4, maxQuantity: 3 },
  { id: 15, name: "Ham", price: 2.00, available: true, categoryId: 4, maxQuantity: 3 },
  { id: 16, name: "Chicken", price: 2.50, available: true, categoryId: 4, maxQuantity: 3 }
];

// Form schema for topping validation
const toppingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  categoryId: z.coerce.number().min(1, { message: "Category is required." }),
  available: z.boolean().default(true),
  maxQuantity: z.coerce.number().min(1, { message: "Max quantity must be at least 1." }).max(10, { message: "Max quantity cannot exceed 10." })
});

// Form schema for category validation
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  minSelection: z.coerce.number().min(0, { message: "Minimum selection cannot be negative." }),
  maxSelection: z.coerce.number().min(1, { message: "Maximum selection must be at least 1." }),
  description: z.string().optional(),
  required: z.boolean().default(false)
});

type ToppingFormValues = z.infer<typeof toppingFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const Toppings = () => {
  const [categories, setCategories] = useState<ToppingCategory[]>(mockCategories);
  const [toppings, setToppings] = useState<Topping[]>(mockToppings);
  const [editTopping, setEditTopping] = useState<Topping | null>(null);
  const [editCategory, setEditCategory] = useState<ToppingCategory | null>(null);
  const [isAddToppingDialogOpen, setIsAddToppingDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>(categories.map(c => c.id));
  const [filterText, setFilterText] = useState('');
  
  const toppingForm = useForm<ToppingFormValues>({
    resolver: zodResolver(toppingFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      categoryId: 1,
      available: true,
      maxQuantity: 1
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      minSelection: 0,
      maxSelection: 1,
      description: "",
      required: false
    },
  });

  const handleEditTopping = (topping: Topping) => {
    setEditTopping(topping);
    toppingForm.reset({
      name: topping.name,
      price: topping.price,
      categoryId: topping.categoryId,
      available: topping.available,
      maxQuantity: topping.maxQuantity
    });
    setIsAddToppingDialogOpen(true);
  };

  const handleAddTopping = () => {
    setEditTopping(null);
    toppingForm.reset({
      name: "",
      price: 0,
      categoryId: 1,
      available: true,
      maxQuantity: 1
    });
    setIsAddToppingDialogOpen(true);
  };

  const handleEditCategory = (category: ToppingCategory) => {
    setEditCategory(category);
    categoryForm.reset({
      name: category.name,
      minSelection: category.minSelection,
      maxSelection: category.maxSelection,
      description: category.description,
      required: category.required
    });
    setIsAddCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditCategory(null);
    categoryForm.reset({
      name: "",
      minSelection: 0,
      maxSelection: 1,
      description: "",
      required: false
    });
    setIsAddCategoryDialogOpen(true);
  };

  const handleDeleteTopping = (id: number) => {
    setToppings(toppings.filter(topping => topping.id !== id));
  };

  const handleDeleteCategory = (id: number) => {
    // Delete the category and all its toppings
    setCategories(categories.filter(category => category.id !== id));
    setToppings(toppings.filter(topping => topping.categoryId !== id));
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const onSubmitTopping = (data: ToppingFormValues) => {
    if (editTopping) {
      // Update existing topping
      setToppings(toppings.map(t => 
        t.id === editTopping.id ? { 
          ...t, 
          name: data.name,
          price: data.price,
          categoryId: data.categoryId,
          available: data.available,
          maxQuantity: data.maxQuantity
        } : t
      ));
    } else {
      // Add new topping
      const newTopping: Topping = {
        id: Math.max(0, ...toppings.map(t => t.id)) + 1,
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        available: data.available,
        maxQuantity: data.maxQuantity
      };
      setToppings([...toppings, newTopping]);
    }
    setIsAddToppingDialogOpen(false);
  };

  const onSubmitCategory = (data: CategoryFormValues) => {
    if (editCategory) {
      // Update existing category
      setCategories(categories.map(c => 
        c.id === editCategory.id ? { 
          ...c, 
          name: data.name,
          minSelection: data.minSelection,
          maxSelection: data.maxSelection,
          description: data.description || "",
          required: data.required
        } : c
      ));
    } else {
      // Add new category
      const newCategory: ToppingCategory = {
        id: Math.max(0, ...categories.map(c => c.id)) + 1,
        name: data.name,
        minSelection: data.minSelection,
        maxSelection: data.maxSelection,
        description: data.description || "",
        required: data.required
      };
      setCategories([...categories, newCategory]);
      // Expand the new category automatically
      setExpandedCategories(prev => [...prev, newCategory.id]);
    }
    setIsAddCategoryDialogOpen(false);
  };

  // Filter toppings based on search term
  const filteredToppings = toppings.filter(topping => 
    topping.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Filter categories that have matching toppings or match the search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(filterText.toLowerCase()) ||
    filteredToppings.some(topping => topping.categoryId === category.id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Toppings Management</h1>
          <div className="space-x-2">
            <Button onClick={handleAddCategory} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
            <Button onClick={handleAddTopping}>
              <Plus className="mr-2 h-4 w-4" />
              Add Topping
            </Button>
          </div>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search toppings or categories..." 
            className="pl-8" 
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="border rounded-md">
              <div 
                className="flex justify-between items-center p-4 bg-muted/30 cursor-pointer"
                onClick={() => toggleCategoryExpansion(category.id)}
              >
                <div className="flex items-center">
                  {expandedCategories.includes(category.id) ? 
                    <ChevronUp className="h-4 w-4 mr-2" /> : 
                    <ChevronDown className="h-4 w-4 mr-2" />
                  }
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {category.required ? "Required" : "Optional"} 
                    {` (${category.minSelection}-${category.maxSelection} selections)`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {expandedCategories.includes(category.id) && (
                <div className="p-4 border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Max Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredToppings
                        .filter(topping => topping.categoryId === category.id)
                        .map((topping) => (
                          <TableRow key={topping.id}>
                            <TableCell>{topping.name}</TableCell>
                            <TableCell>${topping.price.toFixed(2)}</TableCell>
                            <TableCell>{topping.maxQuantity}</TableCell>
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
                      {filteredToppings.filter(t => t.categoryId === category.id).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No toppings in this category
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 border rounded-md">
              <p className="text-muted-foreground">No matching categories or toppings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Topping Dialog */}
      <Dialog open={isAddToppingDialogOpen} onOpenChange={setIsAddToppingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTopping ? 'Edit Topping' : 'Add New Topping'}</DialogTitle>
          </DialogHeader>
          
          <Form {...toppingForm}>
            <form onSubmit={toppingForm.handleSubmit(onSubmitTopping)} className="space-y-4">
              <FormField
                control={toppingForm.control}
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
                control={toppingForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={toppingForm.control}
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
                control={toppingForm.control}
                name="maxQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Quantity Per Item</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum number of times this topping can be added to a single item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={toppingForm.control}
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

      {/* Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sauces, Toppings, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoryForm.control}
                  name="minSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Selections</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={categoryForm.control}
                  name="maxSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Selections</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={categoryForm.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        If enabled, customers must select at least the minimum number of toppings
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{editCategory ? 'Update' : 'Add'} Category</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Toppings;
