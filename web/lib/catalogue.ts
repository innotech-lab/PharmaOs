export type ProductRecord = { name: string; sku: string; unitPrice: string; vatRate: string; stockThreshold: string; active: boolean };
export type SupplierRecord = { name: string; email: string; phone: string; category: string; active: boolean };

const PRODUCTS_KEY = "pharmaos:products";
const SUPPLIERS_KEY = "pharmaos:suppliers";
const UPDATED_EVENT = "pharmaos:catalogue-updated";

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

export const catalogue = {
  products: () => read<ProductRecord>(PRODUCTS_KEY),
  suppliers: () => read<SupplierRecord>(SUPPLIERS_KEY),
  saveProducts: (items: ProductRecord[]) => { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items)); window.dispatchEvent(new Event(UPDATED_EVENT)); },
  saveSuppliers: (items: SupplierRecord[]) => { localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(items)); window.dispatchEvent(new Event(UPDATED_EVENT)); },
  subscribe: (listener: () => void) => { window.addEventListener(UPDATED_EVENT, listener); window.addEventListener("storage", listener); return () => { window.removeEventListener(UPDATED_EVENT, listener); window.removeEventListener("storage", listener); }; },
};
