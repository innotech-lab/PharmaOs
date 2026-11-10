import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { parseProductInput } from './product-input';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private pharmacyScope(tenantId: string, pharmacyId: string) {
    return { tenantId, pharmacyId };
  }

  private async assertPharmacy(tenantId: string, pharmacyId?: string | null) {
    if (!pharmacyId) throw new ForbiddenException('Aucune pharmacie active dans la session');
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { id: pharmacyId, tenantId, active: true },
      select: { id: true },
    });
    if (!pharmacy) throw new ForbiddenException('Pharmacie inaccessible');
    return pharmacy.id;
  }

  async list(tenantId: string, pharmacyId: string) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    return this.prisma.product.findMany({
      where: this.pharmacyScope(tenantId, pharmacyId),
      include: { stock: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, pharmacyId: string, input: unknown) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const data = parseProductInput(input) as {
      sku: string; name: string; priceHT: number; tvaRate: number;
      stockThreshold: number; active: boolean;
    };
    try {
      return await this.prisma.$transaction(async tx => {
        const product = await tx.product.create({
          data: { ...data, tenantId, pharmacyId },
        });
        const stock = await tx.stockLevel.create({ data: { productId: product.id, pharmacyId, quantity: 0 } });
        return { ...product, stock };
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Ce SKU existe déjà dans cette pharmacie');
      throw error;
    }
  }

  async update(tenantId: string, pharmacyId: string, id: string, input: unknown) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const data = parseProductInput(input, true);
    let result;
    try {
      result = await this.prisma.product.updateMany({
        where: { id, ...this.pharmacyScope(tenantId, pharmacyId) },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Ce SKU existe déjà dans cette pharmacie');
      throw error;
    }
    if (!result.count) throw new NotFoundException('Produit introuvable');
    return this.prisma.product.findFirst({
      where: { id, ...this.pharmacyScope(tenantId, pharmacyId) },
      include: { stock: true },
    });
  }

  async deactivate(tenantId: string, pharmacyId: string, id: string) {
    pharmacyId = await this.assertPharmacy(tenantId, pharmacyId);
    const result = await this.prisma.product.updateMany({
      where: { id, ...this.pharmacyScope(tenantId, pharmacyId) },
      data: { active: false },
    });
    if (!result.count) throw new NotFoundException('Produit introuvable');
    return { ok: true };
  }
}
