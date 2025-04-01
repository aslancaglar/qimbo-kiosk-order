
export interface Order {
  id: number;
  customer_type: string;
  table_number: number | null;
  items_count: number;
  total_amount: number;
  status: string; // Now can include "New", "Pending", "In Progress", "Completed", "Cancelled"
  created_at: string;
  order_number: string; // Added the order_number field
  print_status?: 'pending' | 'printed' | 'failed';
  print_attempts?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  notes: string | null;
  menu_item?: MenuItem;
  toppings?: OrderItemTopping[];
}

export interface OrderItemTopping {
  id: number;
  order_item_id: number;
  topping_id: number;
  price: number;
  topping?: Topping;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  status: string;
  has_toppings: boolean;
}

export interface Topping {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export interface PrinterSettings {
  enabled: boolean;
  apiKey: string;
  printerId: number;
  paperWidth: number; // in mm
  charPerLine: number;
  autoPrint: boolean;
}

export interface PrintJob {
  id: number;
  order_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}
