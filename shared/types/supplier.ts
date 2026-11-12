export type SupplierCategory = 'Grossiste répartiteur' | 'Laboratoire' | 'Matériel médical' | 'Autre';

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: SupplierCategory;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
