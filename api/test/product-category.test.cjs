const assert = require('node:assert/strict');
const test = require('node:test');
const { createProductSchema, updateProductSchema } = require('@pharmaos/shared');

const base = { sku: 'PARA500', name: 'Paracétamol 500 mg', priceHT: 1000, tvaRate: 18, stockThreshold: 5 };

test('la catégorie est facultative et nettoyée', () => {
  assert.equal(createProductSchema.parse(base).category, null);
  assert.equal(createProductSchema.parse({ ...base, category: '  Antalgiques ' }).category, 'Antalgiques');
  assert.equal(createProductSchema.parse({ ...base, category: '   ' }).category, null);
  assert.equal(createProductSchema.safeParse({ ...base, category: 'x'.repeat(61) }).success, false);
});

test('une mise à jour sans catégorie ne l’efface pas', () => {
  assert.equal('category' in updateProductSchema.parse({ priceHT: 1200 }), false);
  assert.equal(updateProductSchema.parse({ category: null }).category, null);
});
