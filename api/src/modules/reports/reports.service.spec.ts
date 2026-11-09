import { SalesService } from '../sales/sales.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let sales: SalesService;
  let reports: ReportsService;

  beforeEach(() => {
    sales = new SalesService();
    reports = new ReportsService(sales);
  });

  const checkout = (pharmacyId: string, productId: string, quantity: number, paidAmount: number) => {
    const product = sales.getCatalog().find((entry) => entry.id === productId)!;
    return sales.createSale({
      tenantId: 'tenant-1',
      pharmacyId,
      cashierId: 'cashier-1',
      items: [{ productId, productName: product.name, quantity, unitPrice: product.price, taxRate: 20 }],
      paymentMethod: 'CARD',
      paidAmount,
    });
  };

  it('reports today revenue and top products, filtered to the requested pharmacy', () => {
    checkout('pharmacy-1', 'p1', 2, 12.48);
    checkout('pharmacy-2', 'p3', 1, 2.52);

    const all = reports.getDashboardMetrics();
    expect(all.totalOrders).toBe(2);
    expect(all.totalRevenue).toBe(15);
    expect(all.topProducts[0]).toMatchObject({ productId: 'p1', quantitySold: 2, revenue: 12.48 });

    const pharmacy = reports.getDashboardMetrics('pharmacy-2');
    expect(pharmacy.totalOrders).toBe(1);
    expect(pharmacy.totalRevenue).toBe(2.52);
    expect(pharmacy.topProducts).toEqual([
      expect.objectContaining({ productId: 'p3', quantitySold: 1, revenue: 2.52 }),
    ]);
  });

  it('excludes cancelled sales from revenue and product rankings', () => {
    const sale = checkout('pharmacy-1', 'p1', 2, 12.48);
    sales.cancelSale(sale.id);

    expect(reports.getDashboardMetrics()).toMatchObject({
      totalRevenue: 0,
      totalOrders: 0,
      topProducts: [],
    });
  });

  it('returns low stock products with their threshold', () => {
    checkout('pharmacy-1', 'p1', 31, 193.44);

    const dashboard = reports.getDashboardMetrics('pharmacy-1');
    expect(dashboard.lowStockItems).toBe(1);
    expect(dashboard.lowStockProducts).toContainEqual({
      productId: 'p1',
      productName: 'Paracétamol 500mg',
      stock: 9,
      threshold: 10,
    });
  });
});
