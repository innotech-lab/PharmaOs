const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException, NotFoundException } = require('@nestjs/common');
const { SuppliersService } = require('../dist/src/modules/suppliers/suppliers.service');

function createPrisma() {
  const rows = [{ id: 'supplier-1', tenantId: 'tenant-1', name: 'Grossiste A', email: 'a@exemple.fr', active: true }];
  const matches = where => row => row.id === (where.id ?? row.id) && row.tenantId === where.tenantId;
  return {
    rows,
    supplier: {
      findMany: async ({ where }) => rows.filter(matches(where)),
      findFirst: async ({ where }) => rows.find(matches(where)) ?? null,
      create: async ({ data }) => { const row = { id: `supplier-${rows.length + 1}`, ...data }; rows.push(row); return row; },
      updateMany: async ({ where, data }) => { const found = rows.filter(matches(where)); found.forEach(row => Object.assign(row, data)); return { count: found.length }; },
      deleteMany: async ({ where }) => { const found = rows.filter(matches(where)); found.forEach(row => rows.splice(rows.indexOf(row), 1)); return { count: found.length }; },
    },
  };
}

test('un fournisseur est rattache au tenant de la session', async () => {
  const prisma = createPrisma();
  const created = await new SuppliersService(prisma).create('tenant-1', { name: ' Labo B ', email: 'B@Exemple.fr' });
  assert.equal(created.tenantId, 'tenant-1');
  assert.equal(created.name, 'Labo B');
  assert.equal(created.email, 'b@exemple.fr');
  assert.equal(created.category, 'Grossiste répartiteur');
  assert.equal(created.active, true);
});

test('la creation refuse un e-mail invalide', () => {
  const service = new SuppliersService(createPrisma());
  assert.throws(() => service.create('tenant-1', { name: 'Labo', email: 'pas-un-email' }), BadRequestException);
});

test('la liste ne renvoie que les fournisseurs du tenant', async () => {
  const service = new SuppliersService(createPrisma());
  assert.equal((await service.list('tenant-1')).length, 1);
  assert.equal((await service.list('tenant-autre')).length, 0);
});

test('un autre tenant ne peut ni modifier ni supprimer un fournisseur', async () => {
  const prisma = createPrisma();
  const service = new SuppliersService(prisma);
  await assert.rejects(service.update('tenant-autre', 'supplier-1', { name: 'Autre nom' }), NotFoundException);
  await assert.rejects(service.remove('tenant-autre', 'supplier-1'), NotFoundException);
  assert.equal(prisma.rows[0].name, 'Grossiste A');
});

test('la suppression retire le fournisseur du tenant', async () => {
  const prisma = createPrisma();
  await new SuppliersService(prisma).remove('tenant-1', 'supplier-1');
  assert.equal(prisma.rows.length, 0);
});
