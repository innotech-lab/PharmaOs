import { z } from 'zod';

export const dashboardMetricSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantitySold: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const dashboardMetricsSchema = z.object({
  totalRevenue: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  lowStockItems: z.number().int().nonnegative(),
  topProducts: z.array(dashboardMetricSchema),
});

export const lowStockProductSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  stock: z.number().nonnegative(),
  threshold: z.number().nonnegative(),
});

export const reportDashboardSchema = dashboardMetricsSchema.extend({
  lowStockProducts: z.array(lowStockProductSchema),
});
