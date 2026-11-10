export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export type InventoryLevel = {
  productId: string;
  productName: string;
  sku: string;
  stockThreshold: number;
  quantity: number;
  lowStock: boolean;
};

export type StockMovement = {
  id: string;
  pharmacyId: string;
  productId: string;
  productName?: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
};

