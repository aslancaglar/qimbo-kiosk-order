
export interface Order {
  id: number;
  customer_type: string;
  table_number: number | null;
  items_count: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  notes: string | null;
}

export interface OrderItemTopping {
  id: number;
  order_item_id: number;
  topping_id: number;
  price: number;
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
