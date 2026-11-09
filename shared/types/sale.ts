import { z } from 'zod';
import { paymentMethodSchema, saleCreateSchema, saleItemSchema, saleReceiptSchema, saleStatusSchema } from '../validators/sale';

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type SaleStatus = z.infer<typeof saleStatusSchema>;
export type SaleItem = z.input<typeof saleItemSchema>;
export type SaleCreatePayload = z.input<typeof saleCreateSchema>;
export type SaleReceipt = z.infer<typeof saleReceiptSchema>;
