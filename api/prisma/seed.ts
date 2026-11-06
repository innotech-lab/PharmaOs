import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!', 12);
  const tenant = await prisma.tenant.upsert({ where: { id: 'demo-tenant' }, update: {}, create: { id: 'demo-tenant', name: 'PharmaOS Demo' } });
  const pharmacy = await prisma.pharmacy.upsert({ where: { id: 'demo-pharmacy' }, update: {}, create: { id: 'demo-pharmacy', tenantId: tenant.id, name: 'Pharmacie Demo', country: 'Burundi', city: 'Bujumbura' } });
  await prisma.user.upsert({ where: { tenantId_email: { tenantId: tenant.id, email: 'admin@pharmaos.local' } }, update: { passwordHash, active: true }, create: { tenantId: tenant.id, pharmacyId: pharmacy.id, firstName: 'Admin', lastName: 'PharmaOS', email: 'admin@pharmaos.local', passwordHash, role: Role.OWNER } });
}
main().finally(() => prisma.$disconnect());
