
import { Product } from '../menu/ProductCard';

export interface ToppingItem {
  id: number;
  name: string;
  price: number;
  categoryId?: number;
  maxQuantity?: number;
  quantity?: number;
}

export interface CartItemType {
  id: string;  // Added ID property for item identification
  product: Product;
  quantity: number;
  selectedToppings?: ToppingItem[];
  options?: { name: string; value: string }[];
  notes?: string;
  price: number;  // Added price property for easy access
}
