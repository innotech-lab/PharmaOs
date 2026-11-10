"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { api } from "../lib/api";
import type { Product } from "@pharmaos/shared";

type ProductForm = { sku: string; name: string; priceHT: string; tvaRate: string; stockThreshold: string; active: boolean };
const blankProduct: ProductForm = { sku: "", name: "", priceHT: "", tvaRate: "15", stockThreshold: "0", active: true };
const toForm = (product: Product): ProductForm => ({ sku: product.sku, name: product.name, priceHT: String(product.priceHT), tvaRate: String(product.tvaRate), stockThreshold: String(product.stockThreshold), active: product.active });
const toPayload = (form: ProductForm) => ({ sku: form.sku.trim(), name: form.name.trim(), priceHT: Number(form.priceHT), tvaRate: Number(form.tvaRate), stockThreshold: Number(form.stockThreshold), active: form.active });

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const filtered = useMemo(() => products.filter(product => `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase())), [products, query]);

  useEffect(() => {
    let active = true;
    api<Product[]>("/products").then(items => { if (active) setProducts(items); }).catch(reason => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  function openCreate() { setEditing(null); setForm(blankProduct); setError(""); setModalOpen(true); }
  function openEdit(product: Product) { setEditing(product); setForm(toForm(product)); setError(""); setModalOpen(true); }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const saved = await api<Product>(editing ? `/products/${editing.id}` : "/products", { method: editing ? "PATCH" : "POST", body: JSON.stringify(toPayload(form)) });
      setProducts(current => editing ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setModalOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  }

  async function deactivate(product: Product) {
    if (!window.confirm(`Désactiver « ${product.name} » ?`)) return;
    setError("");
    try { await api(`/products/${product.id}`, { method: "DELETE" }); setReload(value => value + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Désactivation impossible"); }
  }

  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> CATALOGUE</div><h1>Produits</h1></div><button className="button button-primary" onClick={openCreate}><Icon name="plus" size={17}/> Ajouter un produit</button></div>
    {error && !modalOpen && <p className="product-error" role="alert">{error}</p>}
    <section className="panel directory-panel product-directory"><div className="directory-head"><div><h2>Catalogue <span className="count-badge">{products.length}</span></h2></div><label className="table-search"><Icon name="search" size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit"/></label></div>
      {loading ? <div className="empty-state">Chargement du catalogue…</div> : filtered.length ? <div className="product-directory-table-wrap"><table className="product-directory-table"><thead><tr><th>PRODUIT</th><th>SKU</th><th>PRIX HT</th><th>TVA</th><th>SEUIL DE STOCK</th><th>STOCK</th><th>STATUT</th><th>MODIFIER</th></tr></thead><tbody>{filtered.map(product => <tr key={product.id}><td><b>{product.name}</b></td><td>{product.sku}</td><td>{Number(product.priceHT).toFixed(2)}</td><td>{Number(product.tvaRate)} %</td><td>{product.stockThreshold}</td><td>{product.stock?.quantity ?? 0}</td><td><span className={`status-badge ${product.active ? "status-active" : "status-inactive"}`}><i/>{product.active ? "Actif" : "Inactif"}</span></td><td><div className="product-row-actions"><button type="button" onClick={() => openEdit(product)}>Modifier</button>{product.active && <button type="button" onClick={() => deactivate(product)}>Désactiver</button>}</div></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Icon name="box" size={23}/></span><b>{query ? "Aucun produit trouvé" : "Aucun produit"}</b>{query && <p>Modifiez votre recherche.</p>}{!query && <button className="button button-primary" onClick={openCreate}><Icon name="plus" size={17}/> Ajouter un produit</button>}</div>}
    </section>
    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Fermer"><Icon name="close"/></button><div className="modal-icon"><Icon name="box"/></div><div className="section-label">CATALOGUE PRODUITS</div><h2 id="product-modal-title">{editing ? "Modifier le produit" : "Ajouter un produit"}</h2><form className="supplier-form product-form" onSubmit={saveProduct}><label>Nom du produit<input required autoFocus maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Nom du produit"/></label><label>SKU<input required maxLength={64} value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} placeholder="Référence SKU"/></label><label>Prix HT<input required type="number" min="0" step="0.01" value={form.priceHT} onChange={event => setForm({ ...form, priceHT: event.target.value })} placeholder="0,00"/></label><label>TVA (%)<input required type="number" min="0" max="100" step="0.01" value={form.tvaRate} onChange={event => setForm({ ...form, tvaRate: event.target.value })}/></label><label>Seuil de stock<input required type="number" min="0" step="1" value={form.stockThreshold} onChange={event => setForm({ ...form, stockThreshold: event.target.value })}/></label><label className="toggle-label"><span><b>Produit actif</b></span><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/></label>{error && <p className="product-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Annuler</button><button disabled={saving} className="button button-primary" type="submit">{saving ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter le produit"}</button></div></form></section></div>}
  </>;
}
