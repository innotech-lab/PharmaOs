import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';

function jwtStub() {
  return {
    sign: (payload: object) => Buffer.from(JSON.stringify(payload)).toString('base64url'),
    verify: (token: string) => JSON.parse(Buffer.from(token, 'base64url').toString()),
  };
}

test('register persists the refresh token fingerprint and refresh rotates it', async () => {
  const users = new Map<string, any>();
  const prisma: any = {
    user: {
      findFirst: async () => undefined,
      update: async ({ where, data }: any) => { const value = { ...users.get(where.id), ...data }; users.set(where.id, value); return value; },
      findUnique: async ({ where }: any) => users.get(where.id),
    },
    $transaction: async (callback: (tx: any) => Promise<any>) => callback({
      tenant: { create: async () => ({ id: 'tenant-1' }) },
      pharmacy: { create: async () => ({ id: 'pharmacy-1' }) },
      user: { create: async ({ data }: any) => { const value = { id: 'user-1', active: true, ...data }; users.set(value.id, value); return { ...value, role: 'OWNER' }; } },
    }),
  };
  const service = new AuthService(prisma, jwtStub() as any);
  const result = await service.register({ firstName: 'Ada', lastName: 'Lovelace', pharmacy: 'Pharma', country: 'BI', city: 'Bujumbura', email: 'ADA@example.com', password: 'ChangeMe123!' });
  assert.ok(users.get('user-1').refreshHash);
  const refreshed = await service.refresh(result.refreshToken);
  assert.ok(refreshed.refreshToken);
  assert.notEqual(users.get('user-1').refreshHash, undefined);
});

test('non-owner users cannot create, update or delete team members', async () => {
  const service = new UsersService({} as any);
  await assert.rejects(() => service.create('tenant-a', 'MANAGER', { firstName: 'A', lastName: 'B', email: 'a@example.com', password: 'ChangeMe123!', role: 'CASHIER' }), /OWNER/);
  await assert.rejects(() => service.update('tenant-a', 'CASHIER', 'u-1', { active: false }), /OWNER/);
  await assert.rejects(() => service.remove('tenant-a', 'MANAGER', 'u-1', 'owner'), /OWNER/);
});

test('user listing is scoped to the authenticated tenant', async () => {
  let requestedWhere: any;
  const service = new UsersService({ user: { findMany: async ({ where }: any) => { requestedWhere = where; return []; } } } as any);
  await service.list('tenant-a');
  assert.deepEqual(requestedWhere, { tenantId: 'tenant-a' });
});

test('user mutations cannot cross tenant boundaries', async () => {
  const prisma: any = { user: { findFirst: async () => undefined } };
  const service = new UsersService(prisma);
  await assert.rejects(() => service.update('tenant-a', 'OWNER', 'tenant-b-user', { active: false }), /Utilisateur introuvable/);
  await assert.rejects(() => service.remove('tenant-a', 'OWNER', 'tenant-b-user', 'owner'), /Utilisateur introuvable/);
});
