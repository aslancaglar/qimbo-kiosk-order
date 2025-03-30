import React, { useState, useEffect } from 'react';
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
import { Search, Plus, Edit, Trash, ChevronDown, ChevronUp, MoveUp, MoveDown } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define the ToppingCategory interface
interface ToppingCategory {
  id: number;
  name: string;
  min_selection: number;
  max_selection: number;
  description: string;
  required: boolean;
}

// Define the Topping interface
interface Topping {
  id: number;
  name: string;
  price: number;
  available: boolean;
  category_id: number;
  category: string;
  max_quantity: number;
  display_order: number;
}

// Form schema for topping validation
const toppingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  category_id: z.coerce.number().min(1, { message: "Category is required." }),
  available: z.boolean().default(true),
  max_quantity: z.coerce.number().min(1, { message: "Max quantity must be at least 1." }).max(10, { message: "Max quantity cannot exceed 10." })
});

// Form schema for category validation
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  min_selection: z.coerce.number().min(0, { message: "Minimum selection cannot be negative." }),
  max_selection: z.coerce.number().min(1, { message: "Maximum selection must be at least 1." }),
  description: z.string().optional(),
  required: z.boolean().default(false)
});

type ToppingFormValues = z.infer<typeof toppingFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const Toppings = () => {
  const [categories, setCategories] = useState<ToppingCategory[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [editTopping, setEditTopping] = useState<Topping | null>(null);
  const [editCategory, setEditCategory] = useState<ToppingCategory | null>(null);
  const [isAddToppingDialogOpen, setIsAddToppingDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const toppingForm = useForm<ToppingFormValues>({
    resolver: zodResolver(toppingFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      category_id: 1,
      available: true,
      max_quantity: 1
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      min_selection: 0,
      max_selection: 1,
      description: "",
      required: false
    },
  });

  const fetchToppingCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('topping_categories')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      const fetchedCategories = data as ToppingCategory[];
      setCategories(fetchedCategories);
      
      // Expand all categories by default
      setExpandedCategories(fetchedCategories.map(c => c.id));
    } catch (error) {
      console.error('Error fetching topping categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topping categories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchToppings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .order('display_order');
        
      if (error) {
        throw error;
      }
      
      setToppings(data as Topping[]);
    } catch (error) {
      console.error('Error fetching toppings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load toppings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchToppingCategories();
    fetchToppings();
    
    const channel = supabase
      .channel('toppings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'toppings' },
        () => {
          fetchToppings();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topping_categories' },
        () => {
          fetchToppingCategories();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEditTopping = (topping: Topping) => {
    setEditTopping(topping);
    toppingForm.reset({
      name: topping.name,
      price: topping.price,
      category_id: topping.category_id,
      available: topping.available,
      max_quantity: topping.max_quantity
    });
    setIsAddToppingDialogOpen(true);
  };

  const handleAddTopping = () => {
    setEditTopping(null);
    toppingForm.reset({
      name: "",
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : 1,
      available: true,
      max_quantity: 1
    });
    setIsAddToppingDialogOpen(true);
  };

  const handleEditCategory = (category: ToppingCategory) => {
    setEditCategory(category);
    categoryForm.reset({
      name: category.name,
      min_selection: category.min_selection,
      max_selection: category.max_selection,
      description: category.description,
      required: category.required
    });
    setIsAddCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditCategory(null);
    categoryForm.reset({
      name: "",
      min_selection: 0,
      max_selection: 1,
      description: "",
      required: false
    });
    setIsAddCategoryDialogOpen(true);
  };

  const handleDeleteTopping = async (id: number) => {
    try {
      const { error } = await supabase
        .from('toppings')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Topping deleted successfully.',
      });
      
      // Optimistic update
      setToppings(toppings.filter(topping => topping.id !== id));
    } catch (error) {
      console.error('Error deleting topping:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete topping. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      // Check if there are any toppings using this category
      const toppingsInCategory = toppings.filter(t => t.category_id === id);
      
      if (toppingsInCategory.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: 'This category has toppings. Delete the toppings first or move them to another category.',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('topping_categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully.',
      });
      
      // Optimistic update
      setCategories(categories.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleMoveToppingUp = async (topping: Topping, categoryToppings: Topping[]) => {
    // Find the current index of the topping in the sorted list
    const sortedToppings = [...categoryToppings].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedToppings.findIndex(t => t.id === topping.id);
    
    // If already at the top, do nothing
    if (currentIndex <= 0) return;
    
    // Get the topping above this one
    const previousTopping = sortedToppings[currentIndex - 1];
    
    try {
      // Swap the display_order values
      const prevOrder = previousTopping.display_order;
      const currentOrder = topping.display_order;
      
      // Update the previous topping
      const { error: error1 } = await supabase
        .from('toppings')
        .update({ display_order: currentOrder })
        .eq('id', previousTopping.id);
        
      if (error1) throw error1;
      
      // Update the current topping
      const { error: error2 } = await supabase
        .from('toppings')
        .update({ display_order: prevOrder })
        .eq('id', topping.id);
        
      if (error2) throw error2;
      
      // Update the local state
      setToppings(toppings.map(t => {
        if (t.id === topping.id) return { ...t, display_order: prevOrder };
        if (t.id === previousTopping.id) return { ...t, display_order: currentOrder };
        return t;
      }));
      
      toast({
        title: 'Success',
        description: 'Topping order updated successfully.',
      });
    } catch (error) {
      console.error('Error updating topping order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update topping order. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleMoveToppingDown = async (topping: Topping, categoryToppings: Topping[]) => {
    // Find the current index of the topping in the sorted list
    const sortedToppings = [...categoryToppings].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedToppings.findIndex(t => t.id === topping.id);
    
    // If already at the bottom, do nothing
    if (currentIndex >= sortedToppings.length - 1 || currentIndex === -1) return;
    
    // Get the topping below this one
    const nextTopping = sortedToppings[currentIndex + 1];
    
    try {
      // Swap the display_order values
      const nextOrder = nextTopping.display_order;
      const currentOrder = topping.display_order;
      
      // Update the next topping
      const { error: error1 } = await supabase
        .from('toppings')
        .update({ display_order: currentOrder })
        .eq('id', nextTopping.id);
        
      if (error1) throw error1;
      
      // Update the current topping
      const { error: error2 } = await supabase
        .from('toppings')
        .update({ display_order: nextOrder })
        .eq('id', topping.id);
        
      if (error2) throw error2;
      
      // Update the local state
      setToppings(toppings.map(t => {
        if (t.id === topping.id) return { ...t, display_order: nextOrder };
        if (t.id === nextTopping.id) return { ...t, display_order: currentOrder };
        return t;
      }));
      
      toast({
        title: 'Success',
        description: 'Topping order updated successfully.',
      });
    } catch (error) {
      console.error('Error updating topping order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update topping order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmitTopping = async (data: ToppingFormValues) => {
    try {
      if (editTopping) {
        // Update existing topping
        const { error } = await supabase
          .from('toppings')
          .update({
            name: data.name,
            price: data.price,
            category_id: data.category_id,
            available: data.available,
            max_quantity: data.max_quantity,
            // Get the category name from the selected category
            category: categories.find(c => c.id === data.category_id)?.name || ""
          })
          .eq('id', editTopping.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Topping updated successfully.',
        });
      } else {
        // Add new topping
        const categoryName = categories.find(c => c.id === data.category_id)?.name || "";
        
        // Find the highest display_order in this category
        const categoryToppings = toppings.filter(t => t.category_id === data.category_id);
        const maxOrder = categoryToppings.length > 0 
          ? Math.max(...categoryToppings.map(t => t.display_order || 0))
          : 0;
        
        const { error } = await supabase
          .from('toppings')
          .insert([{
            name: data.name,
            price: data.price,
            category_id: data.category_id,
            available: data.available,
            max_quantity: data.max_quantity,
            category: categoryName, // Add the category name
            display_order: maxOrder + 1 // Set the display order to be after the last item
          }]);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Topping added successfully.',
        });
      }
      
      setIsAddToppingDialogOpen(false);
      fetchToppings();
    } catch (error) {
      console.error('Error saving topping:', error);
      toast({
        title: 'Error',
        description: 'Failed to save topping. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmitCategory = async (data: CategoryFormValues) => {
    try {
      if (editCategory) {
        // Update existing category
        const { error } = await supabase
          .from('topping_categories')
          .update({
            name: data.name,
            min_selection: data.min_selection,
            max_selection: data.max_selection,
            description: data.description || "",
            required: data.required
          })
          .eq('id', editCategory.id);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Category updated successfully.',
        });
      } else {
        // Add new category
        const { error } = await supabase
          .from('topping_categories')
          .insert([{
            name: data.name,
            min_selection: data.min_selection,
            max_selection: data.max_selection,
            description: data.description || "",
            required: data.required
          }]);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Category added successfully.',
        });
      }
      
      setIsAddCategoryDialogOpen(false);
      fetchToppingCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter toppings based on search term
  const filteredToppings = toppings.filter(topping => 
    topping.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Filter categories that have matching toppings or match the search term
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(filterText.toLowerCase()) ||
    filteredToppings.some(topping => topping.category_id === category.id)
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
            <Button onClick={handleAddTopping} disabled={categories.length === 0}>
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
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground mb-4">No topping categories available</p>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Category
            </Button>
          </div>
        ) : (
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
                      {` (${category.min_selection}-${category.max_selection} selections)`}
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
                          .filter(topping => topping.category_id === category.id)
                          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                          .map((topping) => {
                            // Get all toppings in this category for move up/down logic
                            const categoryToppings = filteredToppings.filter(t => t.category_id === category.id);
                            const sortedCategoryToppings = [...categoryToppings].sort((a, b) => 
                              (a.display_order || 0) - (b.display_order || 0)
                            );
                            const isFirst = sortedCategoryToppings[0]?.id === topping.id;
                            const isLast = sortedCategoryToppings[sortedCategoryToppings.length - 1]?.id === topping.id;
                            
                            return (
                              <TableRow key={topping.id}>
                                <TableCell>{topping.name}</TableCell>
                                <TableCell>${topping.price.toFixed(2)}</TableCell>
                                <TableCell>{topping.max_quantity}</TableCell>
                                <TableCell>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${topping.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {topping.available ? 'Available' : 'Unavailable'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`h-8 w-8 p-0 ${isFirst ? 'opacity-50' : ''}`}
                                    disabled={isFirst}
                                    onClick={() => handleMoveToppingUp(topping, categoryToppings)}
                                    title="Move up"
                                  >
                                    <MoveUp className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`h-8 w-8 p-0 ${isLast ? 'opacity-50' : ''}`}
                                    disabled={isLast}
                                    onClick={() => handleMoveToppingDown(topping, categoryToppings)}
                                    title="Move down"
                                  >
                                    <MoveDown className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0" 
                                    onClick={() => handleEditTopping(topping)}
                                  >
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
                            );
                          })}
                        {filteredToppings.filter(t => t.category_id === category.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              <p className="mb-2">No toppings in this category</p>
                              <Button variant="outline" size="sm" onClick={() => {
                                toppingForm.setValue('category_id', category.id);
                                handleAddTopping();
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Topping
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
            
            {filteredCategories.length === 0 && !isLoading && (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No matching categories or toppings found</p>
              </div>
            )}
          </div>
        )}
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
                name="category_id"
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
                name="max_quantity"
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
                  name="min_selection"
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
                  name="max_selection"
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
