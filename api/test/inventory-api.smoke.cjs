const assert = require('node:assert/strict');

const baseUrl = process.env.API_TEST_URL || 'http://localhost:3001';
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const cookies = response.headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? ''];
  const accessCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
  return {
    status: response.status,
    data: text ? JSON.parse(text) : null,
    accessToken: accessCookie?.split(';', 1)[0].slice('accessToken='.length),
  };
}

async function register(email, pharmacy) {
  const result = await request('/auth/register', {
    method: 'POST',
    body: {
      firstName: 'Test',
      lastName: 'PharmaOS',
      pharmacy,
      country: 'Burundi',
      city: 'Bujumbura',
      email,
      password: 'LocalTest123!',
    },
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return { ...result.data, accessToken: result.accessToken };
}

async function main() {
  const unauthorized = await request('/products');
  assert.equal(unauthorized.status, 401, 'Les routes produits doivent exiger une session');

  const ownerA = await register(`owner-a-${suffix}@example.test`, 'Officine Test A');
  const productPayload = {
    sku: `SKU-${suffix}`,
    name: 'Produit test inventaire',
    priceHT: 10.5,
    tvaRate: 15,
    stockThreshold: 5,
    active: true,
  };
  const created = await request('/products', { token: ownerA.accessToken, method: 'POST', body: productPayload });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  assert.equal(created.data.stock.quantity, 0);

  const duplicate = await request('/products', { token: ownerA.accessToken, method: 'POST', body: productPayload });
  assert.equal(duplicate.status, 409, 'Un SKU dupliqué doit être refusé');

  const invalid = await request('/products', {
    token: ownerA.accessToken,
    method: 'POST',
    body: { ...productPayload, sku: `INVALID-${suffix}`, priceHT: -1 },
  });
  assert.equal(invalid.status, 400, 'Les prix négatifs doivent être refusés');

  const adjusted = await request('/inventory/movements', {
    token: ownerA.accessToken,
    method: 'POST',
    body: { productId: created.data.id, type: 'ADJUST', quantity: 5, reason: 'Inventaire test' },
  });
  assert.equal(adjusted.status, 201, JSON.stringify(adjusted.data));
  let levels = await request('/inventory/levels', { token: ownerA.accessToken });
  assert.equal(levels.status, 200);
  assert.equal(levels.data[0].quantity, 5);
  assert.equal(levels.data[0].lowStock, true, 'Le stock égal au seuil doit déclencher une alerte');

  const incoming = await request('/inventory/movements', {
    token: ownerA.accessToken,
    method: 'POST',
    body: { productId: created.data.id, type: 'IN', quantity: 3 },
  });
  assert.equal(incoming.status, 201);
  const outgoing = await request('/inventory/movements', {
    token: ownerA.accessToken,
    method: 'POST',
    body: { productId: created.data.id, type: 'OUT', quantity: 2 },
  });
  assert.equal(outgoing.status, 201);

  const insufficient = await request('/inventory/movements', {
    token: ownerA.accessToken,
    method: 'POST',
    body: { productId: created.data.id, type: 'OUT', quantity: 7 },
  });
  assert.equal(insufficient.status, 400, 'Une sortie supérieure au stock doit échouer');
  levels = await request('/inventory/levels', { token: ownerA.accessToken });
  assert.equal(levels.data[0].quantity, 6, 'La sortie refusée ne doit pas modifier le stock');

  const updated = await request(`/products/${created.data.id}`, {
    token: ownerA.accessToken,
    method: 'PATCH',
    body: { name: 'Produit test modifié' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.name, 'Produit test modifié');

  const history = await request('/inventory/movements', { token: ownerA.accessToken });
  assert.equal(history.status, 200);
  assert.equal(history.data.length, 3, 'L’historique doit ignorer la sortie refusée');

  const ownerB = await register(`owner-b-${suffix}@example.test`, 'Officine Test B');
  const foreignProduct = await request('/products', { token: ownerB.accessToken });
  assert.equal(foreignProduct.status, 200);
  assert.equal(foreignProduct.data.length, 0, 'Un autre tenant ne doit pas voir le produit');
  const foreignMovement = await request('/inventory/movements', {
    token: ownerB.accessToken,
    method: 'POST',
    body: { productId: created.data.id, type: 'IN', quantity: 1 },
  });
  assert.equal(foreignMovement.status, 404, 'Un tenant ne doit pas modifier le stock d’un autre');

  const deactivated = await request(`/products/${created.data.id}`, {
    token: ownerA.accessToken,
    method: 'DELETE',
  });
  assert.equal(deactivated.status, 200);

  console.log('OK: auth, CRUD produit, validation, mouvements, stock insuffisant, alerte, historique et isolation tenant.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
