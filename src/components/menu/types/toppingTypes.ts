
export interface ToppingCategory {
  id: number;
  name: string;
  minSelection: number;
  maxSelection: number;
  required: boolean;
  toppings: Topping[];
}

export interface Topping {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  maxQuantity: number;
  quantity?: number;
}

export interface ToppingFormValues {
  selectedToppings: (Topping & { quantity: number })[];
}
