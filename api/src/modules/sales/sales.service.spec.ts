import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(() => {
    service = new SalesService();
  });

  it('should create a sale and reduce stock', () => {
    const sale = service.createSale({
      tenantId: 'tenant-1',
      pharmacyId: 'pharmacy-1',
      cashierId: 'cashier-1',
      customerName: 'Alice',
      items: [
        {
          productId: 'p1',
          productName: 'Paracétamol 500mg',
          quantity: 2,
          unitPrice: 5.2,
          discount: 0,
          taxRate: 20,
        },
      ],
      paymentMethod: 'CASH',
      paidAmount: 12.48,
      status: 'PAID',
    });

    expect(sale.totalTTC).toBeCloseTo(12.48, 2);
    expect(sale.items[0].quantity).toBe(2);
    expect(service.getCatalog().find((product) => product.id === 'p1')?.stock).toBe(38);
  });

  it('should reject sale when stock is insufficient', () => {
    expect(() =>
      service.createSale({
        tenantId: 'tenant-1',
        pharmacyId: 'pharmacy-1',
        cashierId: 'cashier-1',
        items: [
          {
            productId: 'p1',
            productName: 'Paracétamol 500mg',
            quantity: 999,
            unitPrice: 5.2,
            discount: 0,
            taxRate: 20,
          },
        ],
        paymentMethod: 'CARD',
        paidAmount: 500,
      }),
    ).toThrow(BadRequestException);
    expect(service.getCatalog().find((product) => product.id === 'p1')?.stock).toBe(40);
    expect(service.getSales()).toHaveLength(0);
  });

  it('should reject underpaid sale', () => {
    expect(() =>
      service.createSale({
        tenantId: 'tenant-1',
        pharmacyId: 'pharmacy-1',
        cashierId: 'cashier-1',
        items: [
          {
            productId: 'p3',
            productName: 'Eau minérale 1L',
            quantity: 1,
            unitPrice: 2.1,
            discount: 0,
            taxRate: 20,
          },
        ],
        paymentMethod: 'CASH',
        paidAmount: 1,
      }),
    ).toThrow(BadRequestException);
    expect(service.getCatalog().find((product) => product.id === 'p3')?.stock).toBe(60);
    expect(service.getSales()).toHaveLength(0);
  });

  it('uses catalog prices and tax, and finds products by name or SKU', () => {
    expect(service.getCatalog('PARACETAMOL')).toHaveLength(1);
    expect(service.getCatalog('p1')).toHaveLength(1);
    const sale = service.createSale({
      tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', cashierId: 'cashier-1',
      items: [{ productId: 'p1', productName: 'fake', quantity: 1, unitPrice: 0.01, taxRate: 0 }],
      paymentMethod: 'CARD', paidAmount: 6.24,
    });
    expect(sale.items[0].unitPrice).toBe(5.2);
    expect(sale.items[0].taxRate).toBe(20);
    expect(sale.totalTTC).toBe(6.24);
  });

  it('rejects duplicate rows that together exceed stock without changing stock', () => {
    expect(() => service.createSale({
      tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', cashierId: 'cashier-1',
      items: [
        { productId: 'p1', productName: 'Paracétamol', quantity: 25, unitPrice: 5.2, taxRate: 20 },
        { productId: 'p1', productName: 'Paracétamol', quantity: 16, unitPrice: 5.2, taxRate: 20 },
      ], paymentMethod: 'CASH', paidAmount: 1000,
    })).toThrow(BadRequestException);
    expect(service.getCatalog().find((product) => product.id === 'p1')?.stock).toBe(40);
  });

  it('restores stock on cancellation and refuses a second cancellation', () => {
    const sale = service.createSale({
      tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', cashierId: 'cashier-1',
      items: [{ productId: 'p1', productName: 'Paracétamol', quantity: 2, unitPrice: 5.2, taxRate: 20 }],
      paymentMethod: 'CASH', paidAmount: 20,
    });
    expect(service.cancelSale(sale.id).status).toBe('CANCELLED');
    expect(service.getCatalog().find((product) => product.id === 'p1')?.stock).toBe(40);
    expect(() => service.cancelSale(sale.id)).toThrow(BadRequestException);
    expect(service.getCatalog().find((product) => product.id === 'p1')?.stock).toBe(40);
  });

  it('rejects unknown products without creating a sale or changing any stock', () => {
    expect(() => service.createSale({
      tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', cashierId: 'cashier-1',
      items: [{ productId: 'missing', productName: 'Unknown', quantity: 1, unitPrice: 1, taxRate: 20 }],
      paymentMethod: 'CARD', paidAmount: 100,
    })).toThrow(BadRequestException);
    expect(service.getSales()).toHaveLength(0);
    expect(service.getCatalog().map((product) => product.stock)).toEqual([40, 24, 60, 18]);
  });

  it('rejects a cancellation for a sale that does not exist', () => {
    expect(() => service.cancelSale('missing-sale')).toThrow(NotFoundException);
  });

  it.each(['CASH', 'CARD'] as const)('accepts %s payment and returns a printable receipt', (paymentMethod) => {
    const sale = service.createSale({
      tenantId: 'tenant-1', pharmacyId: 'pharmacy-1', cashierId: 'cashier-1',
      items: [{ productId: 'p3', productName: 'Eau minérale 1L', quantity: 1, unitPrice: 2.1, taxRate: 20 }],
      paymentMethod, paidAmount: 2.52,
    });
    expect(sale.paymentMethod).toBe(paymentMethod);
    expect(sale.totalHT).toBe(2.1);
    expect(sale.totalTVA).toBe(0.42);
    expect(sale.totalTTC).toBe(2.52);
    expect(sale.status).toBe('PAID');
    expect(sale.createdAt).toEqual(expect.any(String));
    expect(sale.items).toHaveLength(1);
  });
});
