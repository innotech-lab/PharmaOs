import { z } from 'zod';

export const SUPPLIER_CATEGORIES = ['Grossiste répartiteur', 'Laboratoire', 'Matériel médical', 'Autre'] as const;

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);

const supplierFields = {
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(40),
  notes: optionalText(1000),
};

export const createSupplierSchema = z.object({
  ...supplierFields,
  category: z.enum(SUPPLIER_CATEGORIES).default('Grossiste répartiteur'),
  active: z.boolean().default(true),
});

export const updateSupplierSchema = z.object({
  ...supplierFields,
  category: z.enum(SUPPLIER_CATEGORIES),
  active: z.boolean(),
}).partial().refine(
  value => Object.keys(value).length > 0,
  'Au moins un champ doit être fourni',
);

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
