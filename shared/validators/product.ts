import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  // Facultative : un produit sans catégorie apparaît dans l'onglet « Sans catégorie ».
  category: z.string().trim().max(60).nullish().transform(value => value || null),
  priceHT: z.number().finite().nonnegative(),
  tvaRate: z.number().finite().min(0).max(100),
  stockThreshold: z.number().int().nonnegative(),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().refine(
  value => Object.keys(value).length > 0,
  'Au moins un champ doit être fourni',
);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
