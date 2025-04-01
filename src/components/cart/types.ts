
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
  product: Product;
  quantity: number;
  selectedToppings?: ToppingItem[];
  options?: { name: string; value: string }[];
  notes?: string;
}

export interface PrintNodeSettings {
  apiKey: string;
  enabled: boolean;
  defaultPrinterId?: string;
  printerName?: string;
}

