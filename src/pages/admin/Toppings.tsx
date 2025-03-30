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
import { Search, Plus, Edit, Trash, ChevronDown, ChevronUp, MoveUp, MoveDown, GripVertical } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  display_order?: number;
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
  display_order?: number;
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
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'topping', id: number } | null>(null);
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
        .order('display_order', { ascending: true })
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
        .order('display_order', { ascending: true })
        .order('name');
        
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
        
        // Get the max display_order for this category
        const maxOrderTopping = toppings
          .filter(t => t.category_id === data.category_id)
          .reduce((max, t) => Math.max(max, t.display_order || 0), 0);
        
        const { error } = await supabase
          .from('toppings')
          .insert([{
            name: data.name,
            price: data.price,
            category_id: data.category_id,
            available: data.available,
            max_quantity: data.max_quantity,
            category: categoryName,
            display_order: maxOrderTopping + 10 // Add with a gap of 10 for easier reordering later
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
        // Get the max display_order for categories
        const maxOrderCategory = categories
          .reduce((max, c) => Math.max(max, c.display_order || 0), 0);
          
        // Add new category
        const { error } = await supabase
          .from('topping_categories')
          .insert([{
            name: data.name,
            min_selection: data.min_selection,
            max_selection: data.max_selection,
            description: data.description || "",
            required: data.required,
            display_order: maxOrderCategory + 10 // Add with a gap of 10 for easier reordering
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

  const moveCategory = async (categoryId: number, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (
      (direction === 'up' && categoryIndex === 0) || 
      (direction === 'down' && categoryIndex === categories.length - 1)
    ) {
      return; // Already at the end
    }

    const targetIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    const targetCategory = categories[targetIndex];
    const currentCategory = categories[categoryIndex];

    // Swap display orders
    const tempOrder = targetCategory.display_order || targetIndex * 10;
    
    try {
      // Update the target category
      await supabase
        .from('topping_categories')
        .update({ display_order: currentCategory.display_order || categoryIndex * 10 })
        .eq('id', targetCategory.id);
        
      // Update the current category
      await supabase
        .from('topping_categories')
        .update({ display_order: tempOrder })
        .eq('id', currentCategory.id);
        
      toast({
        title: 'Success',
        description: 'Category order updated.',
      });
      
      fetchToppingCategories();
    } catch (error) {
      console.error('Error updating category order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category order.',
        variant: 'destructive',
      });
    }
  };

  const moveTopping = async (toppingId: number, direction: 'up' | 'down', categoryId: number) => {
    // Get toppings within this category
    const categoryToppings = toppings
      .filter(t => t.category_id === categoryId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
    const toppingIndex = categoryToppings.findIndex(t => t.id === toppingId);
    
    if (
      (direction === 'up' && toppingIndex === 0) || 
      (direction === 'down' && toppingIndex === categoryToppings.length - 1)
    ) {
      return; // Already at the end
    }
    
    const targetIndex = direction === 'up' ? toppingIndex - 1 : toppingIndex + 1;
    const targetTopping = categoryToppings[targetIndex];
    const currentTopping = categoryToppings[toppingIndex];
    
    // Swap display orders
    const tempOrder = targetTopping.display_order || targetIndex * 10;
    
    try {
      // Update the target topping
      await supabase
        .from('toppings')
        .update({ display_order: currentTopping.display_order || toppingIndex * 10 })
        .eq('id', targetTopping.id);
        
      // Update the current topping
      await supabase
        .from('toppings')
        .update({ display_order: tempOrder })
        .eq('id', currentTopping.id);
        
      toast({
        title: 'Success',
        description: 'Topping order updated.',
      });
      
      fetchToppings();
    } catch (error) {
      console.error('Error updating topping order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update topping order.',
        variant: 'destructive',
      });
    }
  };

  const toggleReordering = () => {
    setIsReordering(!isReordering);
  };

  const filteredToppings = toppings.filter(topping => 
    topping.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(filterText.toLowerCase()) ||
    filteredToppings.some(topping => topping.category_id === category.id)
  );

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const orderA = a.display_order || 0;
    const orderB = b.display_order || 0;
    return orderA - orderB;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Toppings Management</h1>
          <div className="space-x-2 flex">
            <Button 
              onClick={toggleReordering} 
              variant={isReordering ? "secondary" : "outline"} 
              className={isReordering ? "bg-amber-100 hover:bg-amber-200 text-amber-800" : ""}
            >
              <GripVertical className="mr-2 h-4 w-4" />
              {isReordering ? "Exit Reordering Mode" : "Reorder Items"}
            </Button>
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
        
        {isReordering && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription>
              You're in reordering mode. Use the up and down arrows to change the order of categories and toppings.
            </AlertDescription>
          </Alert>
        )}
        
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
            {sortedCategories.map((category, categoryIndex) => (
              <div key={category.id} className={`border rounded-md ${draggedItem?.type === 'category' && draggedItem.id === category.id ? 'opacity-50 bg-muted' : ''}`}>
                <div 
                  className="flex justify-between items-center p-4 bg-muted/30 cursor-pointer"
                  onClick={() => !isReordering && toggleCategoryExpansion(category.id)}
                >
                  <div className="flex items-center">
                    {!isReordering ? (
                      expandedCategories.includes(category.id) ? 
                        <ChevronUp className="h-4 w-4 mr-2" /> : 
                        <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
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
                    
                    {isReordering ? (
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCategory(category.id, 'up');
                          }}
                          disabled={categoryIndex === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCategory(category.id, 'down');
                          }}
                          disabled={categoryIndex === sortedCategories.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
                
                {(expandedCategories.includes(category.id) || isReordering) && (
                  <div className="p-4 border-t">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {isReordering && <TableHead className="w-10"></TableHead>}
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Max Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody reorderable={isReordering}>
                        {filteredToppings
                          .filter(topping => topping.category_id === category.id)
                          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                          .map((topping, toppingIndex, filteredCategoryToppings) => (
                            <TableRow 
                              key={topping.id}
                              isDragging={draggedItem?.type === 'topping' && draggedItem.id === topping.id}
                            >
                              {isReordering && (
                                <TableCell className="w-10">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                              )}
                              <TableCell>{topping.name}</TableCell>
                              <TableCell>${topping.price.toFixed(2)}</TableCell>
                              <TableCell>{topping.max_quantity}</TableCell>
                              <TableCell>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${topping.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {topping.available ? 'Available' : 'Unavailable'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {isReordering ? (
                                  <div className="flex justify-end space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => moveTopping(topping.id, 'up', category.id)}
                                      disabled={toppingIndex === 0}
                                    >
                                      <MoveUp className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => moveTopping(topping.id, 'down', category.id)}
                                      disabled={toppingIndex === filteredCategoryToppings.length - 1}
                                    >
                                      <MoveDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredToppings.filter(t => t.category_id === category.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={isReordering ? 6 : 5} className="text-center py-4 text-muted-foreground">
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
