import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { computeSaleLine, computeSaleTotals } from '@pharmaos/shared';
import { PrismaService } from '../../prisma.service';
import { parseCheckout } from './sales.dto';

const saleInclude = {
  items: { orderBy: { productName: 'asc' as const } },
  user: { select: { firstName: true, lastName: true } },
};

const money = (value: unknown) => (value === null || value === undefined ? null : Number(value));

// Les montants Prisma (Decimal) sont renvoyés en nombres pour le client.
export function toSale(sale: any) {
  const amountReceived = money(sale.amountReceived);
  const totalTTC = Number(sale.totalTTC);
  return {
    id: sale.id,
    number: sale.number,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    totalHT: Number(sale.totalHT),
    totalTVA: Number(sale.totalTVA),
    totalTTC,
    amountReceived,
    change: amountReceived === null ? null : Math.round((amountReceived - totalTTC) * 100) / 100,
    cashier: sale.user ?? null,
    createdAt: sale.createdAt,
    cancelledAt: sale.cancelledAt ?? null,
    items: (sale.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceHT: Number(item.unitPriceHT),
      tvaRate: Number(item.tvaRate),
      lineHT: Number(item.lineHT),
      lineTVA: Number(item.lineTVA),
      lineTTC: Number(item.lineTTC),
    })),
  };
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPharmacy(tenantId: string, pharmacyId?: string | null) {
    if (!pharmacyId) throw new ForbiddenException('Aucune pharmacie active dans la session');
    const pharmacy = await this.prisma.pharmacy.findFirst({ where: { id: pharmacyId, tenantId, active: true }, select: { id: true } });
    if (!pharmacy) throw new ForbiddenException('Pharmacie inaccessible');
    return pharmacy.id;
  }

  async list(tenantId: string, pharmacyId: string, limit = 20) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, pharmacyId },
      include: saleInclude,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Math.trunc(limit) || 20, 1), 100),
    });
    return sales.map(toSale);
  }

  // Vente, lignes et sorties de stock dans une seule transaction : aucun stock fantôme si une ligne échoue.
  async checkout(tenantId: string, pharmacyId: string, userId: string, input: unknown) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const data = parseCheckout(input);
    return this.prisma.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: { id: { in: data.items.map(item => item.productId) }, tenantId, pharmacyId, active: true },
      });
      const byId = new Map(products.map(product => [product.id, product]));
      const lines = data.items.map(item => {
        const product = byId.get(item.productId);
        if (!product) throw new NotFoundException('Un produit du panier est introuvable ou inactif dans cette pharmacie');
        const unitPriceHT = Number(product.priceHT);
        const tvaRate = Number(product.tvaRate);
        return { product, quantity: item.quantity, unitPriceHT, tvaRate, ...computeSaleLine(unitPriceHT, tvaRate, item.quantity) };
      });
      const totals = computeSaleTotals(lines);
      if (data.paymentMethod === 'CASH' && data.amountReceived !== undefined && data.amountReceived < totals.totalTTC) {
        throw new BadRequestException('Le montant reçu est inférieur au total à payer');
      }

      for (const line of lines) {
        const updated = await tx.stockLevel.updateMany({
          where: { productId: line.product.id, quantity: { gte: line.quantity } },
          data: { quantity: { decrement: line.quantity } },
        });
        if (!updated.count) throw new BadRequestException(`Stock insuffisant pour « ${line.product.name} »`);
      }

      const pharmacy = await tx.pharmacy.update({ where: { id: pharmacyId }, data: { saleCounter: { increment: 1 } }, select: { saleCounter: true } });
      const sale = await tx.sale.create({
        data: {
          tenantId, pharmacyId, userId, number: pharmacy.saleCounter,
          paymentMethod: data.paymentMethod,
          ...totals,
          amountReceived: data.paymentMethod === 'CASH' ? data.amountReceived ?? totals.totalTTC : null,
          items: {
            create: lines.map(line => ({
              productId: line.product.id, productName: line.product.name, sku: line.product.sku,
              quantity: line.quantity, unitPriceHT: line.unitPriceHT, tvaRate: line.tvaRate,
              lineHT: line.lineHT, lineTVA: line.lineTVA, lineTTC: line.lineTTC,
            })),
          },
        },
        include: saleInclude,
      });

      await tx.stockMovement.createMany({
        data: lines.map(line => ({
          tenantId, pharmacyId, productId: line.product.id, type: 'OUT' as const,
          quantity: line.quantity, reason: `Vente n° ${sale.number}`, reference: sale.id,
        })),
      });
      return toSale(sale);
    });
  }

  // Annulation : la vente reste dans l'historique, le stock vendu est remis en rayon.
  async cancel(tenantId: string, pharmacyId: string, role: string, id: string) {
    if (role !== 'OWNER' && role !== 'MANAGER') throw new ForbiddenException('Seuls un titulaire ou un manager peuvent annuler une vente');
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    return this.prisma.$transaction(async tx => {
      const sale = await tx.sale.findFirst({ where: { id, tenantId, pharmacyId }, include: { items: true } });
      if (!sale) throw new NotFoundException('Vente introuvable');
      const updated = await tx.sale.updateMany({ where: { id, status: 'COMPLETED' }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      if (!updated.count) throw new BadRequestException('Cette vente est déjà annulée');
      for (const item of sale.items) {
        await tx.stockLevel.upsert({
          where: { productId: item.productId },
          create: { productId: item.productId, pharmacyId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        });
      }
      await tx.stockMovement.createMany({
        data: sale.items.map(item => ({
          tenantId, pharmacyId, productId: item.productId, type: 'IN' as const,
          quantity: item.quantity, reason: `Annulation de la vente n° ${sale.number}`, reference: sale.id,
        })),
      });
      return toSale(await tx.sale.findFirstOrThrow({ where: { id }, include: saleInclude }));
    });
  }
}
