export type DayTotals = { revenueTTC: number; salesCount: number };

export type ReportDay = DayTotals & { date: string };

export type TopProduct = { productId: string; productName: string; quantity: number; revenueTTC: number };

export type ReportSummary = {
  timeZone: string;
  days: number;
  today: DayTotals;
  yesterday: DayTotals;
  period: DayTotals & { averageTTC: number };
  previousPeriod: DayTotals;
  daily: ReportDay[];
  topProducts: TopProduct[];
  lowStockCount: number;
};
