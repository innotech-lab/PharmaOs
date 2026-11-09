import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SaleCreatePayload, saleCreateSchema } from '@pharmaos/shared';

export type ProductCatalogItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  threshold: number;
};

@Injectable()
export class SalesService {
  private readonly catalog: ProductCatalogItem[] = [
    { id: 'p1', name: 'Paracétamol 500mg', price: 5.2, stock: 40, threshold: 10 },
    { id: 'p2', name: 'Vitamine C', price: 7.8, stock: 24, threshold: 8 },
    { id: 'p3', name: 'Eau minérale 1L', price: 2.1, stock: 60, threshold: 15 },
    { id: 'p4', name: 'Ibuprofène 200mg', price: 6.5, stock: 18, threshold: 10 },
  ];

  private readonly sales: Array<{
    id: string;
    tenantId: string;
    pharmacyId: string;
    cashierId: string;
    customerName: string;
    paymentMethod: SaleCreatePayload['paymentMethod'];
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    status: 'PAID' | 'CANCELLED';
    paidAmount: number;
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; discount: number; taxRate: number; lineTotal: number }>;
    createdAt: string;
    cancelledAt?: string;
  }> = [];

  getCatalog(search?: string) {
    const normalize = (value: string) => value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const query = search ? normalize(search) : undefined;
    return this.catalog
      .filter((product) => !query || normalize(product.name).includes(query) || normalize(product.id).includes(query))
      .map((product) => ({ ...product }));
  }

  getSales() {
    return this.sales;
  }

  createSale(payload: SaleCreatePayload) {
    const validated = saleCreateSchema.parse(payload);

    if (validated.status === 'CANCELLED') {
      throw new BadRequestException('Une vente doit être encaissée avant de pouvoir être annulée.');
    }

    // Merge duplicate product rows before checking stock so one sale cannot oversell an item.
    const quantities = new Map<string, number>();
    for (const item of validated.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    for (const [productId, quantity] of quantities) {
      const product = this.catalog.find((entry) => entry.id === productId);
      if (!product) throw new BadRequestException(`Produit inconnu : ${productId}`);
      if (product.stock < quantity) throw new BadRequestException(`Stock insuffisant pour ${product.name}`);
    }

    const lineTotals = validated.items.map((item) => {
      const product = this.catalog.find((entry) => entry.id === item.productId);

      if (!product) {
        throw new BadRequestException(`Produit inconnu : ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Stock insuffisant pour ${product.name}`);
      }

      // Never trust client-supplied price or tax values for a completed checkout.
      const unitPrice = product.price;
      const taxRate = 20;
      const subtotal = item.quantity * unitPrice;
      const discountAmount = subtotal * (item.discount / 100);
      const taxable = subtotal - discountAmount;
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice,
        discount: item.discount,
        taxRate,
        lineTotal: Number((taxable * (1 + taxRate / 100)).toFixed(2)),
      };
    });

    const totalHT = Number(
      lineTotals.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100), 0).toFixed(2),
    );
    const totalTVA = Number(
      lineTotals
        .reduce((sum, item) => {
          const taxable = item.quantity * item.unitPrice * (1 - item.discount / 100);
          return sum + taxable * (item.taxRate / 100);
        }, 0)
        .toFixed(2),
    );
    const totalTTC = Number((totalHT + totalTVA).toFixed(2));

    if (validated.paidAmount < totalTTC) {
      throw new BadRequestException('Le montant encaissé est insuffisant pour cette vente.');
    }

    for (const [productId, quantity] of quantities) {
      this.catalog.find((entry) => entry.id === productId)!.stock -= quantity;
    }

    const receipt = {
      id: `SALE-${Date.now()}-${this.sales.length + 1}`,
      tenantId: validated.tenantId,
      pharmacyId: validated.pharmacyId,
      cashierId: validated.cashierId,
      customerName: validated.customerName ?? 'Client walk-in',
      paymentMethod: validated.paymentMethod,
      totalHT,
      totalTVA,
      totalTTC,
      status: 'PAID' as const,
      paidAmount: validated.paidAmount,
      items: lineTotals,
      createdAt: new Date().toISOString(),
    };

    this.sales.push(receipt);
    return receipt;
  }

  cancelSale(id: string) {
    const sale = this.sales.find((entry) => entry.id === id);
    if (!sale) throw new NotFoundException(`Vente introuvable : ${id}`);
    if (sale.status === 'CANCELLED') throw new BadRequestException('Cette vente est déjà annulée.');

    for (const item of sale.items) {
      const product = this.catalog.find((entry) => entry.id === item.productId);
      if (product) product.stock += item.quantity;
    }
    sale.status = 'CANCELLED';
    sale.cancelledAt = new Date().toISOString();
    return sale;
  }
}
