import { z } from 'zod';
import { dashboardMetricSchema, dashboardMetricsSchema, lowStockProductSchema, reportDashboardSchema } from '../validators/report';

export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type LowStockProduct = z.infer<typeof lowStockProductSchema>;
export type ReportDashboard = z.infer<typeof reportDashboardSchema>;
