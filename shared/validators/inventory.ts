import { z } from 'zod';

export const createStockMovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.number().finite().int().nonnegative(),
  reason: z.string().trim().max(240).optional(),
  reference: z.string().trim().max(120).optional(),
}).superRefine((movement, context) => {
  if (movement.type !== 'ADJUST' && movement.quantity === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['quantity'],
      message: 'La quantité doit être supérieure à zéro pour une entrée ou une sortie',
    });
  }
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
