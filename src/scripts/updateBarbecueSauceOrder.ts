
import { supabase } from "@/integrations/supabase/client";

export async function updateBarbecueSauceOrder() {
  try {
    // First, get the Barbecue sauce topping
    const { data: barbecue, error: fetchError } = await supabase
      .from('toppings')
      .select('*')
      .eq('name', 'Barbecue')
      .single();
    
    if (fetchError) {
      console.error('Error fetching Barbecue sauce:', fetchError);
      return { success: false, error: fetchError };
    }
    
    if (!barbecue) {
      console.error('Barbecue sauce not found');
      return { success: false, error: 'Topping not found' };
    }
    
    // Update the display_order to be the lowest (1) to make it appear first
    const { error: updateError } = await supabase
      .from('toppings')
      .update({ display_order: 1 })
      .eq('id', barbecue.id);
    
    if (updateError) {
      console.error('Error updating Barbecue sauce order:', updateError);
      return { success: false, error: updateError };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating Barbecue sauce order:', error);
    return { success: false, error };
  }
}
