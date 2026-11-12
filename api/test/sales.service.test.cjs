const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, ForbiddenException, NotFoundException } = require('@nestjs/common');
const { SalesService } = require('../dist/src/modules/sales/sales.service');
const { computeSaleLine, computeSaleTotals, checkoutSchema } = require('@pharmaos/shared');

function createPrisma({ stock = { 'p-1': 10, 'p-2': 3 }, pharmacyId = 'ph-1' } = {}) {
  const products = [
    { id: 'p-1', tenantId: 't-1', pharmacyId: 'ph-1', name: 'Paracétamol 500 mg', sku: 'PARA500', priceHT: '1000.00', tvaRate: '18.00', active: true },
    { id: 'p-2', tenantId: 't-1', pharmacyId: 'ph-1', name: 'Amoxicilline 1 g', sku: 'AMOX1G', priceHT: '2500.00', tvaRate: '0.00', active: true },
  ].map(product => ({ ...product, pharmacyId }));
  const levels = { ...stock };
  const movements = [];
  const sales = [];
  const counters = { [pharmacyId]: 0 };
  const tx = {
    pharmacy: { update: async ({ where, data }) => { counters[where.id] = (counters[where.id] ?? 0) + data.saleCounter.increment; return { saleCounter: counters[where.id] }; } },
    product: { findMany: async ({ where }) => products.filter(p => where.id.in.includes(p.id) && p.tenantId === where.tenantId && p.pharmacyId === where.pharmacyId) },
    stockLevel: {
      updateMany: async ({ where, data }) => {
        if ((levels[where.productId] ?? 0) < where.quantity.gte) return { count: 0 };
        levels[where.productId] -= data.quantity.decrement;
        return { count: 1 };
      },
      upsert: async ({ where, update }) => { levels[where.productId] = (levels[where.productId] ?? 0) + update.quantity.increment; return {}; },
    },
    sale: {
      create: async ({ data }) => {
        const sale = { id: `s-${sales.length + 1}`, number: sales.length + 1, status: 'COMPLETED', createdAt: new Date(), ...data, items: data.items.create };
        sales.push(sale);
        return sale;
      },
      findFirst: async ({ where }) => sales.find(s => s.id === where.id && s.tenantId === where.tenantId) ?? null,
      updateMany: async ({ where, data }) => {
        const sale = sales.find(s => s.id === where.id && s.status === where.status);
        if (!sale) return { count: 0 };
        Object.assign(sale, data);
        return { count: 1 };
      },
      findFirstOrThrow: async ({ where }) => sales.find(s => s.id === where.id),
    },
    stockMovement: { createMany: async ({ data }) => { movements.push(...data); return { count: data.length }; } },
  };
  return {
    levels, movements, sales,
    pharmacy: { findFirst: async ({ where }) => (where.tenantId === 't-1' ? { id: where.id } : null) },
    $transaction: callback => callback(tx),
  };
}

test('le calcul des lignes et des totaux arrondit au centime', () => {
  const line = computeSaleLine(1000, 18, 3);
  assert.deepEqual(line, { lineHT: 3000, lineTVA: 540, lineTTC: 3540 });
  assert.deepEqual(computeSaleTotals([line, computeSaleLine(2500, 0, 1)]), { totalHT: 5500, totalTVA: 540, totalTTC: 6040 });
});

test('une vente déstocke, enregistre les sorties et calcule les totaux depuis les prix en base', async () => {
  const prisma = createPrisma();
  const sale = await new SalesService(prisma).checkout('t-1', 'ph-1', 'u-1', {
    items: [{ productId: 'p-1', quantity: 2, unitPrice: 1 }, { productId: 'p-2', quantity: 1 }],
    paymentMethod: 'CASH', amountReceived: 10000,
  });
  assert.equal(sale.totalTTC, 2360 + 2500);
  assert.equal(sale.change, 10000 - 4860);
  assert.equal(prisma.levels['p-1'], 8);
  assert.equal(prisma.levels['p-2'], 2);
  assert.equal(prisma.movements.length, 2);
  assert.ok(prisma.movements.every(m => m.type === 'OUT' && m.reference === sale.id));
});

test('chaque pharmacie commence sa numérotation des ventes à 1', async () => {
  const sale1 = await new SalesService(createPrisma({ pharmacyId: 'ph-1' })).checkout('t-1', 'ph-1', 'u-1', { items: [{ productId: 'p-1', quantity: 1 }], paymentMethod: 'CARD' });
  const sale2 = await new SalesService(createPrisma({ pharmacyId: 'ph-2' })).checkout('t-1', 'ph-2', 'u-2', { items: [{ productId: 'p-1', quantity: 1 }], paymentMethod: 'CARD' });
  assert.equal(sale1.number, 1);
  assert.equal(sale2.number, 1);
});

test('un stock insuffisant refuse la vente', async () => {
  const prisma = createPrisma();
  await assert.rejects(
    new SalesService(prisma).checkout('t-1', 'ph-1', 'u-1', { items: [{ productId: 'p-2', quantity: 5 }], paymentMethod: 'CARD' }),
    BadRequestException,
  );
  assert.equal(prisma.sales.length, 0);
  assert.equal(prisma.movements.length, 0);
});

test('un montant reçu inférieur au total est refusé', async () => {
  await assert.rejects(
    new SalesService(createPrisma()).checkout('t-1', 'ph-1', 'u-1', { items: [{ productId: 'p-1', quantity: 1 }], paymentMethod: 'CASH', amountReceived: 500 }),
    BadRequestException,
  );
});

test('un produit d’une autre pharmacie ne peut pas être vendu', async () => {
  await assert.rejects(
    new SalesService(createPrisma()).checkout('t-1', 'ph-1', 'u-1', { items: [{ productId: 'p-autre', quantity: 1 }], paymentMethod: 'CARD' }),
    NotFoundException,
  );
  await assert.rejects(
    new SalesService(createPrisma()).checkout('t-autre', 'ph-autre', 'u-1', { items: [{ productId: 'p-1', quantity: 1 }], paymentMethod: 'CARD' }),
    ForbiddenException,
  );
});

test('le panier refuse les doublons et les quantités nulles', () => {
  assert.equal(checkoutSchema.safeParse({ items: [{ productId: 'p-1', quantity: 1 }, { productId: 'p-1', quantity: 2 }], paymentMethod: 'CASH' }).success, false);
  assert.equal(checkoutSchema.safeParse({ items: [{ productId: 'p-1', quantity: 0 }], paymentMethod: 'CASH' }).success, false);
});

test('l’annulation remet le stock et refuse une seconde annulation', async () => {
  const prisma = createPrisma();
  const service = new SalesService(prisma);
  const sale = await service.checkout('t-1', 'ph-1', 'u-1', { items: [{ productId: 'p-1', quantity: 4 }], paymentMethod: 'CARD' });
  await assert.rejects(service.cancel('t-1', 'ph-1', 'CASHIER', sale.id), ForbiddenException);
  const cancelled = await service.cancel('t-1', 'ph-1', 'MANAGER', sale.id);
  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(prisma.levels['p-1'], 10);
  await assert.rejects(service.cancel('t-1', 'ph-1', 'OWNER', sale.id), BadRequestException);
});
