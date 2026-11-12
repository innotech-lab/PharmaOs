import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { parseSupplierInput } from './suppliers.dto';

// Les fournisseurs appartiennent à l’organisation (tenant) : toutes ses pharmacies partagent le même annuaire.
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.supplier.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  create(tenantId: string, input: unknown) {
    const data = parseSupplierInput(input) as {
      name: string; email: string; phone: string | null; category: string; notes: string | null; active: boolean;
    };
    return this.prisma.supplier.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, input: unknown) {
    const data = parseSupplierInput(input, true);
    const result = await this.prisma.supplier.updateMany({ where: { id, tenantId }, data });
    if (!result.count) throw new NotFoundException('Fournisseur introuvable');
    return this.prisma.supplier.findFirst({ where: { id, tenantId } });
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.supplier.deleteMany({ where: { id, tenantId } });
    if (!result.count) throw new NotFoundException('Fournisseur introuvable');
    return { ok: true };
  }
}
