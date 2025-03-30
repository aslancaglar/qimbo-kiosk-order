
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UpdateToppingOrder: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateBarbecuePosition = async () => {
    setIsUpdating(true);
    try {
      // Update Barbecue sauce to have the lowest display_order (1)
      const { error } = await supabase
        .from('toppings')
        .update({ display_order: 1 })
        .eq('name', 'Barbecue');
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Barbecue sauce has been moved to the top of the list.',
      });
    } catch (error) {
      console.error('Error updating topping order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update topping order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h3 className="font-medium mb-2">Quick Topping Order Update</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Move Barbecue sauce to the top of the topping list.
      </p>
      <Button 
        onClick={updateBarbecuePosition}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Move Barbecue to Top'}
      </Button>
    </div>
  );
};

export default UpdateToppingOrder;
