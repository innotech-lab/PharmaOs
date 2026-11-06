"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icons";

type Product = { name: string; sku: string; unitPrice: string; vatRate: string; stockThreshold: string; active: boolean };
const blankProduct: Product = { name: "", sku: "", unitPrice: "", vatRate: "", stockThreshold: "", active: true };

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Product>(blankProduct);
  const filtered = useMemo(() => products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase())), [products, query]);

  function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProducts(current => [{ ...form }, ...current]);
    setForm(blankProduct);
    setModalOpen(false);
  }

  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> CATALOGUE</div><h1>Produits</h1></div><button className="button button-primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={17}/> Ajouter un produit</button></div>
    <section className="panel directory-panel product-directory"><div className="directory-head"><div><h2>Catalogue <span className="count-badge">{products.length}</span></h2></div><label className="table-search"><Icon name="search" size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit"/></label></div>
      {filtered.length ? <div className="product-directory-table-wrap"><table className="product-directory-table"><thead><tr><th>PRODUIT</th><th>SKU</th><th>PRIX UNITAIRE</th><th>TVA</th><th>SEUIL DE STOCK</th><th>STATUT</th></tr></thead><tbody>{filtered.map(product => <tr key={product.sku}><td><b>{product.name}</b></td><td>{product.sku}</td><td>{product.unitPrice}</td><td>{product.vatRate ? `${product.vatRate} %` : "—"}</td><td>{product.stockThreshold || "—"}</td><td><span className={`status-badge ${product.active ? "status-active" : "status-inactive"}`}><i/>{product.active ? "Actif" : "Inactif"}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Icon name="box" size={23}/></span><b>{query ? "Aucun produit trouvé" : "Aucun produit"}</b>{query && <p>Modifiez votre recherche.</p>}{!query && <button className="button button-primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={17}/> Ajouter un produit</button>}</div>}
    </section>
    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Fermer"><Icon name="close"/></button><div className="modal-icon"><Icon name="box"/></div><div className="section-label">CATALOGUE PRODUITS</div><h2 id="product-modal-title">Ajouter un produit</h2><form className="supplier-form product-form" onSubmit={addProduct}><label>Nom du produit<input required autoFocus value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Nom du produit"/></label><label>SKU<input required value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} placeholder="Référence SKU"/></label><label>Prix unitaire<input required type="number" min="0" step="0.01" value={form.unitPrice} onChange={event => setForm({ ...form, unitPrice: event.target.value })} placeholder="0,00"/></label><label>TVA (%)<input type="number" min="0" step="0.01" value={form.vatRate} onChange={event => setForm({ ...form, vatRate: event.target.value })} placeholder="—"/></label><label>Seuil de stock<input type="number" min="0" step="1" value={form.stockThreshold} onChange={event => setForm({ ...form, stockThreshold: event.target.value })} placeholder="—"/></label><label className="toggle-label"><span><b>Produit actif</b></span><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Annuler</button><button className="button button-primary" type="submit">Ajouter le produit</button></div></form></section></div>}
  </>;
}
