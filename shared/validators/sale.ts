import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CASH', 'CARD']);
export const saleStatusSchema = z.enum(['COMPLETED', 'CANCELLED']);

// Le client n'envoie que les produits et les quantités : les prix et la TVA sont relus en base au moment de l'encaissement.
export const checkoutLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(10000),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutLineSchema).min(1).max(200),
  paymentMethod: paymentMethodSchema,
  amountReceived: z.number().finite().nonnegative().optional(),
}).superRefine((sale, context) => {
  const ids = sale.items.map(item => item.productId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'Chaque produit ne doit apparaître qu’une fois dans le panier' });
  }
});

export type CheckoutLineInput = z.infer<typeof checkoutLineSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// Calcul partagé par l'API et la caisse, pour que le ticket affiché corresponde au montant enregistré.
export function computeSaleLine(unitPriceHT: number, tvaRate: number, quantity: number) {
  const lineHT = round2(unitPriceHT * quantity);
  const lineTVA = round2(lineHT * tvaRate / 100);
  return { lineHT, lineTVA, lineTTC: round2(lineHT + lineTVA) };
}

export function computeSaleTotals(lines: { lineHT: number; lineTVA: number; lineTTC: number }[]) {
  return lines.reduce((totals, line) => ({
    totalHT: round2(totals.totalHT + line.lineHT),
    totalTVA: round2(totals.totalTVA + line.lineTVA),
    totalTTC: round2(totals.totalTTC + line.lineTTC),
  }), { totalHT: 0, totalTVA: 0, totalTTC: 0 });
}

export const unitPriceTTC = (unitPriceHT: number, tvaRate: number) => computeSaleLine(unitPriceHT, tvaRate, 1).lineTTC;
