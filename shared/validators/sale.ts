import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'MIXED']);
export const saleStatusSchema = z.enum(['PENDING', 'PAID', 'COMPLETED', 'CANCELLED']);

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const saleCreateSchema = z.object({
  tenantId: z.string().min(1),
  pharmacyId: z.string().min(1),
  cashierId: z.string().min(1),
  customerName: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
  paymentMethod: paymentMethodSchema,
  paidAmount: z.number().nonnegative(),
  status: saleStatusSchema.optional(),
  notes: z.string().optional(),
});

export const saleReceiptSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  pharmacyId: z.string().min(1),
  cashierId: z.string().min(1),
  customerName: z.string(),
  paymentMethod: paymentMethodSchema,
  totalHT: z.number().nonnegative(),
  totalTVA: z.number().nonnegative(),
  totalTTC: z.number().nonnegative(),
  status: z.enum(['PAID', 'COMPLETED', 'CANCELLED']),
  paidAmount: z.number().nonnegative(),
  items: z.array(saleItemSchema.extend({ lineTotal: z.number().nonnegative() })),
  createdAt: z.string().datetime(),
  cancelledAt: z.string().datetime().optional(),
});
