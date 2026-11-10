import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { parseStockMovement } from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPharmacy(tenantId: string, pharmacyId?: string | null) {
    if (!pharmacyId) throw new ForbiddenException('Aucune pharmacie active dans la session');
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { id: pharmacyId, tenantId, active: true },
      select: { id: true },
    });
    if (!pharmacy) throw new ForbiddenException('Pharmacie inaccessible');
    return pharmacy.id;
  }

  async levels(tenantId: string, pharmacyId: string) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const products = await this.prisma.product.findMany({
      where: { tenantId, pharmacyId, active: true },
      include: { stock: true },
      orderBy: { name: 'asc' },
    });
    return products.map(product => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      stockThreshold: product.stockThreshold,
      quantity: product.stock?.quantity ?? 0,
      lowStock: (product.stock?.quantity ?? 0) <= product.stockThreshold,
    }));
  }

  async movements(tenantId: string, pharmacyId: string) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    return this.prisma.stockMovement.findMany({
      where: { tenantId, pharmacyId },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createMovement(tenantId: string, pharmacyId: string, input: unknown) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const data = parseStockMovement(input);
    return this.prisma.$transaction(async tx => {
      const product = await tx.product.findFirst({
        where: { id: data.productId, tenantId, pharmacyId, active: true },
      });
      if (!product) throw new NotFoundException('Produit introuvable dans cette pharmacie');
      const stock = await tx.stockLevel.findUnique({ where: { productId: product.id } });
      const current = stock?.quantity ?? 0;
      if (data.type === 'OUT') {
        const updated = await tx.stockLevel.updateMany({
          where: { productId: product.id, quantity: { gte: data.quantity } },
          data: { quantity: { decrement: data.quantity } },
        });
        if (!updated.count) throw new BadRequestException('Stock insuffisant');
      } else if (data.type === 'IN') {
        if (!Number.isSafeInteger(current + data.quantity)) throw new BadRequestException('La quantité dépasse la limite autorisée');
        const updated = await tx.stockLevel.updateMany({
          where: { productId: product.id },
          data: { quantity: { increment: data.quantity } },
        });
        if (!updated.count) {
          await tx.stockLevel.create({ data: { productId: product.id, pharmacyId, quantity: data.quantity } });
        }
      } else {
        await tx.stockLevel.upsert({
          where: { productId: product.id },
          create: { productId: product.id, pharmacyId, quantity: data.quantity },
          update: { quantity: data.quantity },
        });
      }
      return tx.stockMovement.create({
        data: {
          tenantId, pharmacyId, productId: product.id,
          type: data.type, quantity: data.quantity,
          reason: data.reason, reference: data.reference,
        },
      });
    });
  }
}
