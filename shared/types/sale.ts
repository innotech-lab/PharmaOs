import { z } from 'zod';
import { paymentMethodSchema, saleStatusSchema } from '../validators/sale';

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type SaleStatus = z.infer<typeof saleStatusSchema>;

export type SaleLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
  lineHT: number;
  lineTVA: number;
  lineTTC: number;
};

export type Sale = {
  id: string;
  number: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  amountReceived: number | null;
  change: number | null;
  cashier: { firstName: string; lastName: string } | null;
  items: SaleLine[];
  createdAt: string;
  cancelledAt: string | null;
};
