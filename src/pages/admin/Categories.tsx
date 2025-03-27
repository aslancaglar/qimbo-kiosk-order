
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash, ArrowUp, ArrowDown } from "lucide-react";
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
  FormMessage
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
}

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  display_order: z.number().int().default(0)
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      display_order: 0
    },
  });

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
    
    const channel = supabase
      .channel('category-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      display_order: category.display_order
    });
    setIsDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditCategory(null);
    form.reset({
      name: "",
      description: "",
      display_order: categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (id: number) => {
    // Check if category is in use by menu items
    try {
      const { count, error: countError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
        
      if (countError) {
        throw countError;
      }
      
      if (count && count > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This category is used by ${count} menu items. Please reassign those items first.`,
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully.',
      });
      
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    try {
      const currentIndex = categories.findIndex(c => c.id === category.id);
      if (
        (direction === 'up' && currentIndex === 0) || 
        (direction === 'down' && currentIndex === categories.length - 1)
      ) {
        return; // Already at the top/bottom
      }
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetCategory = categories[targetIndex];
      
      // Swap display orders
      const { error: error1 } = await supabase
        .from('menu_categories')
        .update({ display_order: targetCategory.display_order })
        .eq('id', category.id);
        
      const { error: error2 } = await supabase
        .from('menu_categories')
        .update({ display_order: category.display_order })
        .eq('id', targetCategory.id);
        
      if (error1 || error2) {
        throw error1 || error2;
      }
      
      fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder categories. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (editCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update({
            name: data.name,
            description: data.description || null,
            display_order: data.display_order
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
        const { error } = await supabase
          .from('menu_categories')
          .insert([{
            name: data.name,
            description: data.description || null,
            display_order: data.display_order
          }]);
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Category added successfully.',
        });
      }
      
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="h-full flex flex-col space-y-6 overflow-hidden">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Menu Categories</h1>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search categories..." 
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
                  <TableHead>Description</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">#{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || "-"}</TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleMoveCategory(category, 'up')}
                            disabled={categories.indexOf(category) === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleMoveCategory(category, 'down')}
                            disabled={categories.indexOf(category) === categories.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              Fill in the details below to {editCategory ? 'update' : 'add'} a menu category.
            </DialogDescription>
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
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Category description (optional)" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
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

export default Categories;
