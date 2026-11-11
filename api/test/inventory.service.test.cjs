const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, ForbiddenException, NotFoundException } = require('@nestjs/common');
const { InventoryService } = require('../dist/src/modules/inventory/inventory.service');
const { ProductsService } = require('../dist/src/modules/products/products.service');
const { createStockMovementSchema } = require('@pharmaos/shared');

function createPrisma({ quantity = 10, pharmacyAllowed = true, productFound = true } = {}) {
  let currentQuantity = quantity;
  const movements = [];
  const tx = {
    product: {
      findFirst: async ({ where }) => productFound
        ? { id: where.id, tenantId: where.tenantId, pharmacyId: where.pharmacyId, active: true }
        : null,
    },
    stockLevel: {
      findUnique: async () => currentQuantity === null ? null : { quantity: currentQuantity },
      updateMany: async ({ where, data }) => {
        if (currentQuantity === null) return { count: 0 };
        if (where.quantity?.gte !== undefined && currentQuantity < where.quantity.gte) return { count: 0 };
        if (data.quantity?.decrement !== undefined) currentQuantity -= data.quantity.decrement;
        if (data.quantity?.increment !== undefined) currentQuantity += data.quantity.increment;
        return { count: 1 };
      },
      create: async ({ data }) => {
        currentQuantity = data.quantity;
        return { ...data };
      },
      upsert: async ({ create, update }) => {
        currentQuantity = currentQuantity === null ? create.quantity : update.quantity;
        return { quantity: currentQuantity };
      },
    },
    stockMovement: {
      create: async ({ data }) => {
        const movement = { id: `movement-${movements.length + 1}`, ...data };
        movements.push(movement);
        return movement;
      },
    },
  };
  return {
    movements,
    get quantity() { return currentQuantity; },
    pharmacy: {
      findFirst: async ({ where }) => pharmacyAllowed && where.id === 'pharmacy-1' && where.tenantId === 'tenant-1'
        ? { id: where.id }
        : null,
    },
    product: { findMany: async () => [] },
    $transaction: callback => callback(tx),
  };
}

const context = { tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', productId: 'product-1' };

test('IN ajoute la quantité et enregistre un mouvement dans la transaction', async () => {
  const prisma = createPrisma({ quantity: 10 });
  const service = new InventoryService(prisma);
  await service.createMovement(context.tenantId, context.pharmacyId, {
    productId: context.productId, type: 'IN', quantity: 5,
  });
  assert.equal(prisma.quantity, 15);
  assert.equal(prisma.movements.length, 1);
});

test('OUT retire la quantité demandée', async () => {
  const prisma = createPrisma({ quantity: 10 });
  const service = new InventoryService(prisma);
  await service.createMovement(context.tenantId, context.pharmacyId, {
    productId: context.productId, type: 'OUT', quantity: 3,
  });
  assert.equal(prisma.quantity, 7);
  assert.equal(prisma.movements[0].type, 'OUT');
});

test('OUT supérieur au stock disponible est refusé sans mouvement ni décrément', async () => {
  const prisma = createPrisma({ quantity: 4 });
  const service = new InventoryService(prisma);
  await assert.rejects(
    service.createMovement(context.tenantId, context.pharmacyId, {
      productId: context.productId, type: 'OUT', quantity: 5,
    }),
    error => error instanceof BadRequestException && error.getStatus() === 400,
  );
  assert.equal(prisma.quantity, 4);
  assert.equal(prisma.movements.length, 0);
});

test('ADJUST accepte zéro et remplace le niveau existant', async () => {
  const prisma = createPrisma({ quantity: 4 });
  const service = new InventoryService(prisma);
  await service.createMovement(context.tenantId, context.pharmacyId, {
    productId: context.productId, type: 'ADJUST', quantity: 0,
  });
  assert.equal(prisma.quantity, 0);
  assert.equal(prisma.movements[0].type, 'ADJUST');
});

test('les mouvements refusent les quantités fractionnaires et les entrées/sorties nulles', () => {
  assert.equal(createStockMovementSchema.safeParse({ productId: 'p1', type: 'IN', quantity: 1.5 }).success, false);
  assert.equal(createStockMovementSchema.safeParse({ productId: 'p1', type: 'OUT', quantity: 0 }).success, false);
  assert.equal(createStockMovementSchema.safeParse({ productId: 'p1', type: 'ADJUST', quantity: 0 }).success, true);
});

test('le stock est inaccessible depuis une pharmacie ou un tenant non autorisé', async () => {
  const prisma = createPrisma({ pharmacyAllowed: false });
  const service = new InventoryService(prisma);
  await assert.rejects(service.levels('tenant-other', 'pharmacy-other'), ForbiddenException);
});

test('un produit absent de la pharmacie ne reçoit aucun mouvement', async () => {
  const prisma = createPrisma({ productFound: false });
  const service = new InventoryService(prisma);
  await assert.rejects(
    service.createMovement(context.tenantId, context.pharmacyId, {
      productId: context.productId, type: 'IN', quantity: 1,
    }),
    NotFoundException,
  );
  assert.equal(prisma.movements.length, 0);
});

test('les produits restent limités au tenant et à la pharmacie autorisés', async () => {
  const prisma = createPrisma({ pharmacyAllowed: false });
  const service = new ProductsService(prisma);
  await assert.rejects(service.list('tenant-other', 'pharmacy-other'), ForbiddenException);
});
