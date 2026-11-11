import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class ReportsService {
  constructor(private readonly salesService: SalesService) {}

  getDashboardMetrics(pharmacyId?: string) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const sales = this.salesService.getSales().filter((sale) =>
      sale.status !== 'CANCELLED' &&
      new Date(sale.createdAt).getTime() >= startOfDay.getTime() &&
      (!pharmacyId || sale.pharmacyId === pharmacyId),
    );
    const catalog = this.salesService.getCatalog();

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalTTC || 0), 0);
    const totalOrders = sales.length;
    const lowStockProducts = catalog
      .filter((product) => product.stock <= product.threshold)
      .map((product) => ({ productId: product.id, productName: product.name, stock: product.stock, threshold: product.threshold }));
    const lowStockItems = lowStockProducts.length;

    const productMap = new Map<string, { productId: string; productName: string; quantitySold: number; revenue: number }>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const current = productMap.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        };

        current.quantitySold += item.quantity;
        current.revenue += item.lineTotal;
        productMap.set(item.productId, current);
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: item.quantitySold,
        revenue: Number(item.revenue.toFixed(2)),
      }));

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      lowStockItems,
      lowStockProducts,
      topProducts,
    };
  }
}
