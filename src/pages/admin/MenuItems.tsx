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
import { Search, Plus, Edit, Trash, Upload, Image, FileImage } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: string;
  status: "Active" | "Inactive";
  hasToppings: boolean;
  availableToppingCategories?: number[];
  image?: string;
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
  image: z.string().optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

const MenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toppingCategories, setToppingCategories] = useState<ToppingCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      image: "",
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
        availableToppingCategories: item.available_topping_categories || [],
        image: item.image
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
    ensureBucketExists();
    
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

  const ensureBucketExists = async () => {
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket('menu_images');
      
      if (bucketError && bucketError.message.includes('does not exist')) {
        console.log('Creating bucket menu_images...');
        const { error: createError } = await supabase.storage.createBucket('menu_images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          throw createError;
        }
        
        console.log('Bucket created successfully');
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  };

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
    setImagePreview(item.image || null);
    form.reset({
      name: item.name,
      category: item.category,
      price: item.price.replace('$', ''),
      status: item.status,
      hasToppings: item.hasToppings,
      availableToppingCategories: item.availableToppingCategories || [],
      image: item.image,
    });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setEditItem(null);
    setImageFile(null);
    setImagePreview(null);
    form.reset({
      name: "",
      category: "",
      price: "",
      status: "Active",
      hasToppings: false,
      availableToppingCategories: [],
      image: "",
    });
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, GIF, WEBP)',
          variant: 'destructive',
        });
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      console.log('Image file set:', file.name);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    try {
      await ensureBucketExists();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `menu_items/${fileName}`;
      
      console.log('Uploading file to path:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('menu_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('menu_images')
        .getPublicUrl(filePath);
        
      console.log('Uploaded successfully. Public URL:', data.publicUrl);  
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image - Full details:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imagePreview || !editItem || !editItem.image) return;
    
    try {
      const urlParts = editItem.image.split('/');
      const filePath = `menu_items/${urlParts[urlParts.length - 1]}`;
      
      const { error } = await supabase.storage
        .from('menu_images')
        .remove([filePath]);
        
      if (error) {
        throw error;
      }
      
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ image: null })
        .eq('id', editItem.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setImagePreview(null);
      form.setValue('image', '');
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
      
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive',
      });
    }
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
      setIsUploading(true);
      const priceValue = parseFloat(data.price.replace('$', ''));
      
      if (isNaN(priceValue)) {
        toast({
          title: 'Error',
          description: 'Invalid price format. Please enter a valid number.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }
      
      let imageUrl = data.image || null;
      
      if (imageFile) {
        console.log('Uploading new image file...');
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast({
            title: 'Error',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
      }
      
      const menuItemData = {
        name: data.name,
        category: data.category,
        price: priceValue,
        status: data.status,
        has_toppings: data.hasToppings,
        available_topping_categories: data.hasToppings ? data.availableToppingCategories : [],
        image: imageUrl
      };
      
      console.log("Saving menu item data:", menuItemData);
      
      if (editItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editItem.id);
          
        if (error) {
          console.error("Update error:", error);
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
          console.error("Insert error:", error);
          throw error;
        }
        
        toast({
          title: 'Success',
          description: 'Menu item added successfully.',
        });
      }
      
      setIsDialogOpen(false);
      fetchMenuItems();
      
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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
                  <TableHead>Image</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">#{item.id}</TableCell>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          {item.image ? (
                            <AvatarImage src={item.image} alt={item.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              <Image className="h-4 w-4 text-primary" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.hasToppings ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                            {item.availableToppingCategories?.length || 0} categories
                          </Badge>
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
                    <TableCell colSpan={8} className="text-center py-8">
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
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-1/3 space-y-4">
                      <FormItem className="mb-4">
                        <FormLabel>Product Image</FormLabel>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                          {imagePreview ? (
                            <div className="relative w-full">
                              <div className="relative mx-auto w-32 h-32 overflow-hidden rounded-lg mb-2">
                                <img 
                                  src={imagePreview} 
                                  alt="Product preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex justify-center space-x-2">
                                <label 
                                  htmlFor="image-upload" 
                                  className="flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                                >
                                  <Upload className="mr-2 h-3.5 w-3.5" />
                                  Change
                                </label>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={handleDeleteImage}
                                >
                                  <Trash className="mr-2 h-3.5 w-3.5" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-2 flex flex-col sm:flex-row text-sm text-gray-600 items-center justify-center">
                                <label
                                  htmlFor="image-upload"
                                  className="relative cursor-pointer mb-2 sm:mb-0 rounded-md bg-primary px-3 py-1.5 text-white font-medium hover:bg-primary/90 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="image-upload"
                                    name="image-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageChange}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF, WEBP up to 5MB
                              </p>
                            </div>
                          )}
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                          />
                        </div>
                      </FormItem>
                    </div>
                    
                    <div className="md:w-2/3 space-y-4">
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
                    </div>
                  </div>
                  
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
                            {toppingCategories.length > 0 ? (
                              toppingCategories.map((category) => (
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
                              ))
                            ) : (
                              <div className="col-span-2 text-center p-4 border border-dashed rounded-md">
                                <p className="text-gray-500">No topping categories available. You need to create topping categories first.</p>
                              </div>
                            )}
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
                    <Button 
                      type="submit" 
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                          Uploading...
                        </>
                      ) : (
                        <>{editItem ? 'Update' : 'Add'} Menu Item</>
                      )}
                    </Button>
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
