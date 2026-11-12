"use client";

import { useEffect, useMemo, useState } from "react";
import { unitPriceTTC, type Product } from "@pharmaos/shared";
import { Icon } from "./icons";
import { EmptyState, LoadingRows, Modal, Notice, PageHeader, StockGauge } from "./ui";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";

type ProductForm = { sku: string; name: string; category: string; priceHT: string; tvaRate: string; stockThreshold: string; active: boolean };
const blankProduct: ProductForm = { sku: "", name: "", category: "", priceHT: "", tvaRate: "15", stockThreshold: "0", active: true };
const toForm = (product: Product): ProductForm => ({ sku: product.sku, name: product.name, category: product.category ?? "", priceHT: String(Number(product.priceHT)), tvaRate: String(Number(product.tvaRate)), stockThreshold: String(product.stockThreshold), active: product.active });
const toPayload = (form: ProductForm) => ({ sku: form.sku.trim(), name: form.name.trim(), category: form.category.trim() || null, priceHT: Number(form.priceHT), tvaRate: Number(form.tvaRate), stockThreshold: Number(form.stockThreshold), active: form.active });
// Rayons courants d'une officine, proposés tant que le catalogue n'a pas ses propres catégories.
const suggestedCategories = ["Antalgiques", "Antibiotiques", "Antipaludéens", "Diabète", "Vitamines", "Hygiène", "Premiers soins", "Bébé"];
type Filter = "all" | "active" | "low" | "inactive";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ text: string; productId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [lastCategory, setLastCategory] = useState("");
  const categories = useMemo(() => [...new Set([...products.map(product => product.category).filter((value): value is string => Boolean(value)), ...suggestedCategories])].sort((a, b) => a.localeCompare(b)), [products]);

  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter(product => product.active).length,
    low: products.filter(product => product.active && (product.stock?.quantity ?? 0) <= product.stockThreshold).length,
    inactive: products.filter(product => !product.active).length,
  }), [products]);
  const filtered = useMemo(() => products.filter(product => {
    const matches = `${product.name} ${product.sku}`.toLowerCase().includes(query.trim().toLowerCase());
    const quantity = product.stock?.quantity ?? 0;
    const inFilter = filter === "all" || (filter === "active" && product.active) || (filter === "inactive" && !product.active) || (filter === "low" && product.active && quantity <= product.stockThreshold);
    return matches && inFilter;
  }), [products, query, filter]);
  const previewTTC = form.priceHT !== "" && form.tvaRate !== "" ? unitPriceTTC(Number(form.priceHT), Number(form.tvaRate)) : null;

  useEffect(() => {
    let active = true;
    api<Product[]>("/products").then(items => { if (active) setProducts(items); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Chargement impossible"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  // La catégorie du dernier produit enregistré est proposée par défaut, pour saisir un rayon d'un trait.
  function openCreate() { setEditing(null); setForm({ ...blankProduct, category: lastCategory }); setError(""); setModalOpen(true); }
  function openEdit(product: Product) { setEditing(product); setForm(toForm(product)); setError(""); setModalOpen(true); }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess(null);
    try {
      const saved = await api<Product>(editing ? `/products/${editing.id}` : "/products", { method: editing ? "PATCH" : "POST", body: JSON.stringify(toPayload(form)) });
      setProducts(current => editing ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setLastCategory(saved.category ?? "");
      // Un nouveau produit a un stock de 0 : on propose tout de suite la saisie du stock.
      setSuccess(editing ? { text: `« ${saved.name} » a été mis à jour` } : { text: `« ${saved.name} » a été ajouté au catalogue, avec un stock de 0`, productId: saved.id });
      setModalOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  }

  async function deactivate(product: Product) {
    if (!window.confirm(`Désactiver « ${product.name} » ? Il ne sera plus proposé à la caisse. Vous pourrez le réactiver.`)) return;
    setError(""); setSuccess(null);
    try { await api(`/products/${product.id}`, { method: "DELETE" }); setSuccess({ text: `« ${product.name} » a été désactivé` }); setReload(value => value + 1); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Désactivation impossible"); }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "active", label: `Actifs ${counts.active}` },
    { id: "low", label: `Sous le seuil ${counts.low}` },
    { id: "inactive", label: `Inactifs ${counts.inactive}` },
    { id: "all", label: `Tous ${counts.all}` },
  ];

  return <>
    <PageHeader title="Produits" subtitle="Le catalogue vendu au comptoir : prix, TVA et seuil d’alerte de chaque référence">
      <button className="ph-btn ph-btn-primary" onClick={openCreate}><Icon name="plus" size={16}/>Ajouter un produit</button>
    </PageHeader>
    {error && !modalOpen && <Notice tone="error">{error}</Notice>}
    {success && <Notice tone="success" action={success.productId ? { href: `/inventory?product=${success.productId}`, label: "Saisir le stock" } : undefined}>{success.text}</Notice>}

    <section className="ph-card ph-card-flush" aria-labelledby="catalog-title">
      <div className="ph-card-head">
        <h2 className="ph-card-title" id="catalog-title">Catalogue</h2>
        <div className="ph-toolbar">
          <div className="ph-segment" role="group" aria-label="Filtrer les produits">{filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
          <label className="ph-input-search"><Icon name="search" size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom ou SKU" aria-label="Rechercher un produit"/></label>
        </div>
      </div>
      {loading ? <LoadingRows/> : filtered.length ? <div className="ph-table-wrap"><table className="ph-table">
        <thead><tr><th>Produit</th><th className="ph-num">Prix de vente</th><th className="ph-num ph-hide-sm">TVA</th><th>Stock</th><th className="ph-hide-sm">Statut</th><th><span className="ph-sr">Actions</span></th></tr></thead>
        <tbody>{filtered.map(product => <tr key={product.id}>
          <td><span className="ph-cell-main"><b>{product.name}</b><small>{product.sku}{product.category ? ` · ${product.category}` : ""}</small></span></td>
          <td className="ph-num"><span className="ph-cell-main"><b>{formatMoney(unitPriceTTC(Number(product.priceHT), Number(product.tvaRate)))}</b><small>{formatMoney(product.priceHT)} HT</small></span></td>
          <td className="ph-num ph-hide-sm">{Number(product.tvaRate)} %</td>
          <td><StockGauge quantity={product.stock?.quantity ?? 0} threshold={product.stockThreshold}/></td>
          <td className="ph-hide-sm"><span className={`ph-badge ${product.active ? "is-ok" : "is-muted"}`}>{product.active ? "Actif" : "Inactif"}</span></td>
          <td><div className="ph-row-actions">
            <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => openEdit(product)}>Modifier</button>
            {product.active && <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => deactivate(product)}>Désactiver</button>}
          </div></td>
        </tr>)}</tbody>
      </table></div> : products.length ? <EmptyState icon="search" title="Aucun produit trouvé" text="Modifiez la recherche ou le filtre."/> : <EmptyState icon="box" title="Votre catalogue est vide" text="Ajoutez les produits que vous vendez au comptoir pour suivre leur stock et les encaisser."><button className="ph-btn ph-btn-primary" onClick={openCreate}><Icon name="plus" size={16}/>Ajouter un produit</button></EmptyState>}
      {!loading && filtered.length > 0 && <p className="ph-table-foot">{filtered.length} produit{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>}
    </section>

    {modalOpen && <Modal title={editing ? "Modifier le produit" : "Ajouter un produit"} description={editing ? undefined : "Le stock se saisit ensuite dans l’inventaire."} onClose={() => setModalOpen(false)}>
      <form className="ph-form" onSubmit={saveProduct}>
        <label className="ph-field"><span>Nom du produit</span><input required autoFocus maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Paracétamol 500 mg, boîte de 16"/></label>
        <div className="ph-form-row">
          <label className="ph-field"><span>SKU</span><input required maxLength={64} value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} placeholder="PARA500-16"/></label>
          <label className="ph-field"><span>Catégorie (facultatif)</span><input list="product-categories" maxLength={60} value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} placeholder="Antalgiques"/></label>
        </div>
        <datalist id="product-categories">{categories.map(category => <option key={category} value={category}/>)}</datalist>
        <p className="ph-hint" style={{ marginTop: -8 }}>La catégorie crée un onglet dans la caisse pour retrouver le produit plus vite</p>
        <div className="ph-form-row">
          <label className="ph-field"><span>Prix HT (FBu)</span><input required type="number" min="0" step="0.01" inputMode="decimal" value={form.priceHT} onChange={event => setForm({ ...form, priceHT: event.target.value })} placeholder="0"/></label>
          <label className="ph-field"><span>TVA (%)</span><input required type="number" min="0" max="100" step="0.01" inputMode="decimal" value={form.tvaRate} onChange={event => setForm({ ...form, tvaRate: event.target.value })}/></label>
        </div>
        <p className="ph-hint" aria-live="polite">{previewTTC !== null ? <>Prix de vente au comptoir : <b>{formatMoney(previewTTC)}</b> TTC</> : "Le prix TTC s’affiche dès que le prix HT est saisi"}</p>
        <label className="ph-field"><span>Seuil d’alerte</span><input required type="number" min="0" step="1" inputMode="numeric" value={form.stockThreshold} onChange={event => setForm({ ...form, stockThreshold: event.target.value })}/><span className="ph-hint">Le produit passe « Sous le seuil » quand son stock atteint cette quantité</span></label>
        <label className="ph-switch"><span>Produit actif, proposé à la caisse</span><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/></label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="ph-form-actions"><button type="button" className="ph-btn ph-btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button><button disabled={saving} className="ph-btn ph-btn-primary" type="submit">{saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter au catalogue"}</button></div>
      </form>
    </Modal>}
  </>;
}
