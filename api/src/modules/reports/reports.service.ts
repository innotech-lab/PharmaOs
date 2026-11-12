import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { parseReportQuery } from './reports.dto';

type DailyRow = { day: string; revenue: string | number | null; count: bigint | number };
type TopRow = { productId: string; productName: string; quantity: bigint | number; revenue: string | number | null };

const DAY_MS = 86_400_000;

// Date du jour (AAAA-MM-JJ) dans le fuseau de l'officine.
function localDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function shiftDate(isoDate: string, days: number) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPharmacy(tenantId: string, pharmacyId?: string | null) {
    if (!pharmacyId) throw new ForbiddenException('Aucune pharmacie active dans la session');
    const pharmacy = await this.prisma.pharmacy.findFirst({ where: { id: pharmacyId, tenantId, active: true }, select: { id: true } });
    if (!pharmacy) throw new ForbiddenException('Pharmacie inaccessible');
    return pharmacy.id;
  }

  // Seules les ventes encaissées (non annulées) comptent dans le chiffre d'affaires.
  async summary(tenantId: string, pharmacyId: string, query: unknown) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const { days, timeZone } = parseReportQuery(query);
    const today = localDate(new Date(), timeZone);
    const firstDay = shiftDate(today, -(days * 2 - 1));
    const since = new Date(Date.parse(`${firstDay}T00:00:00Z`) - 2 * DAY_MS);

    const rows = await this.prisma.$queryRaw<DailyRow[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day,
             SUM("totalTTC") AS revenue, COUNT(*) AS count
      FROM "Sale"
      WHERE "tenantId" = ${tenantId} AND "pharmacyId" = ${pharmacyId} AND status = 'COMPLETED' AND "createdAt" >= ${since}
      GROUP BY 1`;
    const byDay = new Map(rows.map(row => [row.day, { revenueTTC: Number(row.revenue ?? 0), salesCount: Number(row.count) }]));
    const totalsFor = (date: string) => byDay.get(date) ?? { revenueTTC: 0, salesCount: 0 };

    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => shiftDate(today, from + index));
    const daily = range(-(days - 1), 0).map(date => ({ date, ...totalsFor(date) }));
    const sum = (dates: string[]) => dates.reduce((total, date) => {
      const value = totalsFor(date);
      return { revenueTTC: Math.round((total.revenueTTC + value.revenueTTC) * 100) / 100, salesCount: total.salesCount + value.salesCount };
    }, { revenueTTC: 0, salesCount: 0 });
    const period = sum(daily.map(day => day.date));
    const previousPeriod = sum(range(-(days * 2 - 1), -days));

    const periodStart = daily[0].date;
    const top = await this.prisma.$queryRaw<TopRow[]>`
      SELECT i."productId" AS "productId", MAX(i."productName") AS "productName",
             SUM(i.quantity) AS quantity, SUM(i."lineTTC") AS revenue
      FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId"
      WHERE s."tenantId" = ${tenantId} AND s."pharmacyId" = ${pharmacyId} AND s.status = 'COMPLETED' AND s."createdAt" >= ${since}
        AND to_char((s."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') >= ${periodStart}
      GROUP BY i."productId"
      ORDER BY revenue DESC
      LIMIT 5`;

    const products = await this.prisma.product.findMany({
      where: { tenantId, pharmacyId, active: true },
      select: { stockThreshold: true, stock: { select: { quantity: true } } },
    });

    return {
      timeZone,
      days,
      today: totalsFor(today),
      yesterday: totalsFor(shiftDate(today, -1)),
      period: { ...period, averageTTC: period.salesCount ? Math.round(period.revenueTTC / period.salesCount * 100) / 100 : 0 },
      previousPeriod,
      daily,
      topProducts: top.map(row => ({ productId: row.productId, productName: row.productName, quantity: Number(row.quantity), revenueTTC: Number(row.revenue ?? 0) })),
      lowStockCount: products.filter(product => (product.stock?.quantity ?? 0) <= product.stockThreshold).length,
    };
  }
}
