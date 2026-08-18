export interface Product {
  id: number;
  category: string;
  hindi: string;
  english: string;
  portion: string;
  halfPrice: string;
  fullPrice: string;
  stock: string;
}

export interface CartItem extends Product {
  selectedPortion: 'Half' | 'Full' | 'Custom';
  selectedPrice: number;
}
