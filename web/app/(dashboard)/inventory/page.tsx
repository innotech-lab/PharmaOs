"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";

type Level = { productId: string; productName: string; sku: string; stockThreshold: number; quantity: number; lowStock: boolean };
type Movement = { id: string; productId: string; product?: { name: string; sku: string }; type: "IN" | "OUT" | "ADJUST"; quantity: number; reason: string | null; createdAt: string };
type Product = { id: string; name: string; sku: string; active: boolean };

export default function InventoryPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const lowStockCount = useMemo(() => levels.filter(level => level.lowStock).length, [levels]);

  useEffect(() => {
    let active = true;
    Promise.all([api<Level[]>("/inventory/levels"), api<Movement[]>("/inventory/movements"), api<Product[]>("/products")])
      .then(([stock, history, catalog]) => { if (active) { setLevels(stock); setMovements(history); setProducts(catalog.filter(product => product.active)); if (!productId && catalog[0]) setProductId(catalog[0].id); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  async function adjust(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await api("/inventory/movements", { method: "POST", body: JSON.stringify({ productId, type: "ADJUST", quantity: Number(quantity), reason: reason.trim() || "Ajustement manuel" }) }); setQuantity(""); setReason(""); setReload(value => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ajustement impossible"); }
    finally { setSaving(false); }
  }

  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> STOCK</div><h1>Inventaire</h1></div></div>
    {error && <p className="product-error" role="alert">{error}</p>}
    <div className="kpi-grid inventory-kpis"><article className="kpi-card"><small>RÉFÉRENCES ACTIVES</small><b className="kpi-value">{levels.length}</b></article><article className="kpi-card"><small>ALERTES DE STOCK BAS</small><b className="kpi-value">{lowStockCount}</b></article><article className="kpi-card"><small>MOUVEMENTS RÉCENTS</small><b className="kpi-value">{movements.length}</b></article></div>
    <div className="inventory-layout">
      <section className="panel directory-panel"><div className="directory-head"><div><h2>Niveaux de stock <span className="count-badge">{levels.length}</span></h2></div></div>
        {loading ? <div className="empty-state">Chargement du stock…</div> : levels.length ? <div className="product-directory-table-wrap"><table className="product-directory-table"><thead><tr><th>PRODUIT</th><th>SKU</th><th>QUANTITÉ</th><th>SEUIL</th><th>ÉTAT</th></tr></thead><tbody>{levels.map(level => <tr key={level.productId}><td><b>{level.productName}</b></td><td>{level.sku}</td><td>{level.quantity}</td><td>{level.stockThreshold}</td><td><span className={`status-badge ${level.lowStock ? "status-inactive" : "status-active"}`}><i/>{level.lowStock ? "Stock bas" : "En stock"}</span></td></tr>)}</tbody></table></div> : <div className="empty-state">Aucun produit actif dans cette pharmacie.</div>}
      </section>
      <section className="panel inventory-adjust"><div className="section-label">MOUVEMENT DE STOCK</div><h2>Ajuster une quantité</h2><p>La nouvelle quantité saisie remplacera le stock actuel.</p><form className="supplier-form" onSubmit={adjust}><label>Produit<select required value={productId} onChange={event => setProductId(event.target.value)}><option value="" disabled>Choisir un produit</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label><label>Nouvelle quantité<input required type="number" min="0" step="1" value={quantity} onChange={event => setQuantity(event.target.value)}/></label><label>Motif (facultatif)<input maxLength={240} value={reason} onChange={event => setReason(event.target.value)} placeholder="Inventaire physique"/></label><button className="button button-primary" disabled={saving || !products.length} type="submit">{saving ? "Enregistrement…" : "Enregistrer l’ajustement"}</button></form></section>
    </div>
    <section className="panel directory-panel inventory-history"><div className="directory-head"><div><h2>Historique des mouvements <span className="count-badge">{movements.length}</span></h2></div></div>{loading ? <div className="empty-state">Chargement de l’historique…</div> : movements.length ? <div className="product-directory-table-wrap"><table className="product-directory-table"><thead><tr><th>DATE</th><th>PRODUIT</th><th>MOUVEMENT</th><th>QUANTITÉ</th><th>MOTIF</th></tr></thead><tbody>{movements.map(movement => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString("fr-FR")}</td><td><b>{movement.product?.name ?? movement.productId}</b></td><td>{movement.type}</td><td>{movement.type === "OUT" ? "−" : movement.type === "IN" ? "+" : "="}{movement.quantity}</td><td>{movement.reason ?? "—"}</td></tr>)}</tbody></table></div> : <div className="empty-state">Aucun mouvement enregistré.</div>}</section>
  </>;
}
