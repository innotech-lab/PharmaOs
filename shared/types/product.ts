export type Product = {
  id: string;
  pharmacyId: string;
  sku: string;
  name: string;
  priceHT: number;
  tvaRate: number;
  stockThreshold: number;
  active: boolean;
  stock?: { quantity: number } | null;
  createdAt: string;
  updatedAt: string;
};

