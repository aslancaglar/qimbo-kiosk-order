
import { Product } from '../menu/ProductCard';

export interface CartItemType {
  product: Product;
  quantity: number;
  options?: { name: string; value: string }[];
}
