"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryLevel } from "@pharmaos/shared";
import { Icon } from "../../../components/icons";
import { EmptyState, LoadingRows, Notice, PageHeader, StockGauge, stockStatus } from "../../../components/ui";
import { api } from "../../../lib/api";
import { formatDateTime, formatNumber, MOVEMENT_LABELS } from "../../../lib/format";

type Movement = { id: string; productId: string; product?: { name: string; sku: string }; type: "IN" | "OUT" | "ADJUST"; quantity: number; reason: string | null; createdAt: string };
type Filter = "all" | "low";

export default function InventoryPage() {
  const [levels, setLevels] = useState<InventoryLevel[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const quantityRef = useRef<HTMLInputElement>(null);
  const requested = useRef<string | null>(null);

  const lowCount = useMemo(() => levels.filter(level => level.lowStock).length, [levels]);
  const visible = useMemo(() => levels.filter(level => (filter === "all" || level.lowStock) && `${level.productName} ${level.sku}`.toLowerCase().includes(query.trim().toLowerCase())), [levels, filter, query]);
  const current = levels.find(level => level.productId === productId);
  const next = quantity === "" ? null : Number(quantity);
  const difference = current && next !== null && Number.isFinite(next) ? next - current.quantity : null;

  useEffect(() => {
    try { requested.current = new URLSearchParams(window.location.search).get("product"); } catch { requested.current = null; }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api<InventoryLevel[]>("/inventory/levels"), api<Movement[]>("/inventory/movements")])
      .then(([stock, history]) => {
        if (!active) return;
        setLevels(stock); setMovements(history);
        // Produit demandé par un lien (alerte, nouveau produit), sinon le produit déjà choisi, sinon le premier sous le seuil.
        const wanted = requested.current && stock.some(level => level.productId === requested.current) ? requested.current : null;
        const keep = stock.some(level => level.productId === productId) ? productId : null;
        const selected = wanted ?? keep ?? stock.find(level => level.lowStock)?.productId ?? stock[0]?.productId ?? "";
        if (wanted) { requested.current = null; window.setTimeout(() => quantityRef.current?.focus(), 0); }
        setProductId(selected);
        setQuantity(String(stock.find(level => level.productId === selected)?.quantity ?? ""));
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  function select(id: string, focus = false) {
    setProductId(id); setSuccess("");
    setQuantity(String(levels.find(level => level.productId === id)?.quantity ?? ""));
    if (focus) window.setTimeout(() => { quantityRef.current?.focus(); quantityRef.current?.select(); }, 0);
  }

  async function adjust(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const before = current?.quantity ?? 0;
    try {
      await api("/inventory/movements", { method: "POST", body: JSON.stringify({ productId, type: "ADJUST", quantity: Number(quantity), reason: reason.trim() || "Ajustement manuel" }) });
      setSuccess(`Stock de « ${current?.productName ?? "ce produit"} » mis à jour : ${before} → ${Number(quantity)}`);
      setReason(""); setReload(value => value + 1);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Ajustement impossible"); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeader title="Inventaire" subtitle="Le stock de chaque produit face à son seuil d’alerte, et l’historique des mouvements"/>
    {error && <Notice tone="error">{error}</Notice>}

    <section className="ph-stats" aria-label="Indicateurs de stock">
      <article className="ph-stat"><p className="ph-stat-label">Références actives</p><p className="ph-stat-value">{loading ? "—" : formatNumber(levels.length)}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Sous le seuil</p><p className="ph-stat-value">{loading ? "—" : formatNumber(lowCount)}</p><p className="ph-stat-delta">{loading ? "" : lowCount ? <b className="is-warn">À commander</b> : "Aucune alerte"}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">En rupture</p><p className="ph-stat-value">{loading ? "—" : formatNumber(levels.filter(level => level.quantity <= 0).length)}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Mouvements récents</p><p className="ph-stat-value">{loading ? "—" : formatNumber(movements.length)}</p><p className="ph-stat-delta">100 derniers au plus</p></article>
    </section>

    <div className="ph-grid-main">
      <section className="ph-card ph-card-flush" aria-labelledby="levels-title">
        <div className="ph-card-head">
          <h2 className="ph-card-title" id="levels-title">Niveaux de stock</h2>
          <div className="ph-toolbar">
            <div className="ph-segment" role="group" aria-label="Filtrer"><button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tous {levels.length}</button><button type="button" aria-pressed={filter === "low"} onClick={() => setFilter("low")}>Sous le seuil {lowCount}</button></div>
            <label className="ph-input-search"><Icon name="search" size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom ou SKU" aria-label="Rechercher un produit"/></label>
          </div>
        </div>
        {loading ? <LoadingRows/> : visible.length ? <div className="ph-table-wrap"><table className="ph-table">
          <thead><tr><th>Produit</th><th>Stock</th><th className="ph-num ph-hide-sm">Seuil</th><th className="ph-hide-sm">État</th><th><span className="ph-sr">Actions</span></th></tr></thead>
          <tbody>{visible.map(level => { const status = stockStatus(level.quantity, level.stockThreshold); return <tr key={level.productId} className={level.productId === productId ? "is-selected" : ""}>
            <td><span className="ph-cell-main"><b>{level.productName}</b><small>{level.sku}</small></span></td>
            <td><StockGauge quantity={level.quantity} threshold={level.stockThreshold}/></td>
            <td className="ph-num ph-hide-sm">{level.stockThreshold}</td>
            <td className="ph-hide-sm"><span className={`ph-badge ${status.tone}`}>{status.label}</span></td>
            <td><div className="ph-row-actions"><button type="button" className="ph-btn ph-btn-secondary ph-btn-sm" onClick={() => select(level.productId, true)} aria-label={`Ajuster le stock de ${level.productName}`}>Ajuster</button></div></td>
          </tr>; })}</tbody>
        </table></div> : levels.length ? <EmptyState icon="check" title={filter === "low" ? "Aucun produit sous le seuil" : "Aucun produit trouvé"} text={filter === "low" ? "Tous les produits sont au-dessus de leur seuil d’alerte." : "Modifiez la recherche."}/> : <EmptyState icon="box" title="Aucun produit actif" text="Ajoutez des produits au catalogue pour suivre leur stock."/>}
      </section>

      <section className="ph-card" aria-labelledby="adjust-title">
        <div className="ph-card-head"><div><h2 className="ph-card-title" id="adjust-title">Ajuster une quantité</h2><p className="ph-card-meta">La quantité saisie remplace le stock actuel</p></div></div>
        <form className="ph-form" onSubmit={adjust}>
          <label className="ph-field"><span>Produit</span><select required value={productId} onChange={event => select(event.target.value)} disabled={!levels.length}><option value="" disabled>Choisir un produit</option>{levels.map(level => <option key={level.productId} value={level.productId}>{level.productName} · {level.sku}</option>)}</select></label>
          <label className="ph-field"><span>Nouvelle quantité</span><input ref={quantityRef} required type="number" min="0" step="1" inputMode="numeric" value={quantity} onChange={event => { setQuantity(event.target.value); setSuccess(""); }} aria-describedby="adjust-preview" disabled={!levels.length}/></label>
          <p className="ph-hint" id="adjust-preview" aria-live="polite">{current ? difference === null || difference === 0 ? <>Stock actuel : <b>{current.quantity}</b>{difference === 0 ? ", aucun changement" : ""}</> : <>Stock actuel : {current.quantity} → nouveau : <b>{next}</b> ({difference > 0 ? "+" : "−"}{Math.abs(difference)})</> : "Choisissez un produit pour voir son stock actuel"}</p>
          <label className="ph-field"><span>Motif (facultatif)</span><input maxLength={240} value={reason} onChange={event => setReason(event.target.value)} placeholder="Inventaire physique"/></label>
          <button className="ph-btn ph-btn-primary ph-btn-block" disabled={saving || !levels.length || difference === 0} type="submit">{saving ? "Enregistrement…" : "Enregistrer l’ajustement"}</button>
          {success && <Notice tone="success">{success}</Notice>}
        </form>
      </section>
    </div>

    <section className="ph-card ph-card-flush" aria-labelledby="history-title">
      <div className="ph-card-head"><h2 className="ph-card-title" id="history-title">Historique des mouvements</h2><p className="ph-card-meta">Ventes, annulations et ajustements</p></div>
      {loading ? <LoadingRows/> : movements.length ? <div className="ph-table-wrap"><table className="ph-table">
        <thead><tr><th>Date</th><th>Produit</th><th>Mouvement</th><th className="ph-num">Quantité</th><th className="ph-hide-sm">Motif</th></tr></thead>
        <tbody>{(showAllHistory ? movements : movements.slice(0, 12)).map(movement => <tr key={movement.id}>
          <td className="ph-tabular">{formatDateTime(movement.createdAt)}</td>
          <td><span className="ph-cell-main"><b>{movement.product?.name ?? movement.productId}</b>{movement.product?.sku && <small>{movement.product.sku}</small>}</span></td>
          <td><span className={`ph-badge ${movement.type === "OUT" ? "is-muted" : movement.type === "IN" ? "is-ok" : "is-warn"}`}>{MOVEMENT_LABELS[movement.type] ?? movement.type}</span></td>
          <td className="ph-num">{movement.type === "OUT" ? "−" : movement.type === "IN" ? "+" : "= "}{movement.quantity}</td>
          <td className="ph-hide-sm">{movement.reason ?? "—"}</td>
        </tr>)}</tbody>
      </table>{movements.length > 12 && <p className="ph-table-foot"><button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => setShowAllHistory(value => !value)}>{showAllHistory ? "Afficher les 12 derniers" : `Afficher les ${movements.length} mouvements`}</button></p>}</div> : <EmptyState icon="stock" title="Aucun mouvement" text="Les ventes et les ajustements de stock apparaîtront ici."/>}
    </section>
  </>;
}
