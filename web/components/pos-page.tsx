"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeSaleLine, computeSaleTotals, unitPriceTTC, type PaymentMethod, type Product, type Sale } from "@pharmaos/shared";
import { Icon } from "./icons";
import { EmptyState, LoadingRows, Notice, PageHeader, StockGauge } from "./ui";
import { api } from "../lib/api";
import { formatDateTime, formatMoney, formatTime, PAYMENT_LABELS } from "../lib/format";
import { canManage, useCurrentUser } from "../lib/session";

type CartLine = { productId: string; quantity: number };
const cartKey = "pharmaos:pos-cart";
const tabKey = "pharmaos:pos-tab";
const ALL = "__all";
const NONE = "__none";

// Montants ronds proposés au-dessus du total, pour saisir l'argent reçu en un geste.
function quickAmounts(total: number) {
  const values = new Set<number>();
  for (const step of [1000, 5000, 10000, 20000]) {
    const rounded = Math.ceil(total / step) * step;
    if (rounded > total) values.add(rounded);
  }
  return [...values].sort((a, b) => a - b).slice(0, 3);
}

export function PosPage() {
  const user = useCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(ALL);
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [reload, setReload] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const newSaleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try { const saved = sessionStorage.getItem(cartKey); if (saved) setCart(JSON.parse(saved)); } catch { /* panier non restauré */ }
    try { const savedTab = sessionStorage.getItem(tabKey); if (savedTab) setTab(savedTab); } catch { /* onglet par défaut */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(tabKey, tab); } catch { /* onglet non mémorisé */ }
  }, [tab]);
  useEffect(() => {
    try { sessionStorage.setItem(cartKey, JSON.stringify(cart)); } catch { /* panier non sauvegardé */ }
  }, [cart]);

  useEffect(() => {
    let active = true;
    Promise.all([api<Product[]>("/products"), api<Sale[]>("/sales?limit=8")])
      .then(([catalog, recent]) => { if (active) { setProducts(catalog.filter(product => product.active)); setSales(recent); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const byId = useMemo(() => new Map(products.map(product => [product.id, product])), [products]);
  const stockOf = (product: Product) => product.stock?.quantity ?? 0;
  // Onglets : « Tous », puis chaque catégorie par ordre alphabétique, puis « Sans catégorie » s'il y en a.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) { const key = product.category ?? NONE; counts.set(key, (counts.get(key) ?? 0) + 1); }
    const named = [...counts.keys()].filter(key => key !== NONE).sort((a, b) => a.localeCompare(b)).map(key => ({ id: key, label: key, count: counts.get(key) ?? 0 }));
    return [{ id: ALL, label: "Tous", count: products.length }, ...named, ...(counts.has(NONE) ? [{ id: NONE, label: "Sans catégorie", count: counts.get(NONE) ?? 0 }] : [])];
  }, [products]);
  const activeTab = tabs.some(item => item.id === tab) ? tab : ALL;
  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    // La recherche porte sur tout le catalogue ; sans recherche, on montre l'onglet choisi.
    const inTab = (product: Product) => searching || activeTab === ALL || (product.category ?? NONE) === activeTab;
    // Les produits disponibles d'abord, les ruptures en fin de grille.
    return products
      .filter(product => inTab(product) && (!text || `${product.name} ${product.sku}`.toLowerCase().includes(text)))
      .sort((a, b) => Number(stockOf(b) > 0) - Number(stockOf(a) > 0) || a.name.localeCompare(b.name))
      .slice(0, 60);
  }, [products, query, searching, activeTab]);
  const inCart = useMemo(() => new Map(cart.map(line => [line.productId, line.quantity])), [cart]);

  const lines = cart.flatMap(line => {
    const product = byId.get(line.productId);
    if (!product) return [];
    const price = Number(product.priceHT); const rate = Number(product.tvaRate);
    return [{ product, quantity: line.quantity, ...computeSaleLine(price, rate, line.quantity) }];
  });
  const totals = computeSaleTotals(lines);
  const receivedAmount = received === "" ? null : Number(received);
  const change = payment === "CASH" && receivedAmount !== null ? Math.round((receivedAmount - totals.totalTTC) * 100) / 100 : null;
  const short = change !== null && change < 0;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  function add(product: Product) {
    setError(""); setNotice("");
    const inCart = cart.find(line => line.productId === product.id)?.quantity ?? 0;
    if (inCart >= stockOf(product)) { setError(`Stock insuffisant pour « ${product.name} » : ${stockOf(product)} disponible${stockOf(product) > 1 ? "s" : ""}`); return; }
    setCart(current => current.some(line => line.productId === product.id) ? current.map(line => line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { productId: product.id, quantity: 1 }]);
  }

  function setQuantity(productId: string, quantity: number) {
    const product = byId.get(productId);
    if (!product) return;
    const limited = Math.max(0, Math.min(Math.trunc(quantity) || 0, stockOf(product)));
    setCart(current => limited === 0 ? current.filter(line => line.productId !== productId) : current.map(line => line.productId === productId ? { ...line, quantity: limited } : line));
  }

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const text = query.trim().toLowerCase();
    const exact = products.find(product => product.sku.toLowerCase() === text);
    const first = exact ?? results.find(product => stockOf(product) > 0);
    if (first) { add(first); setQuery(""); }
  }

  async function checkout() {
    if (!lines.length || short) return;
    setPaying(true); setError(""); setNotice("");
    try {
      const sale = await api<Sale>("/sales", { method: "POST", body: JSON.stringify({
        items: cart.map(line => ({ productId: line.productId, quantity: line.quantity })),
        paymentMethod: payment,
        ...(payment === "CASH" && receivedAmount !== null ? { amountReceived: receivedAmount } : {}),
      }) });
      setReceipt(sale); setCart([]); setReceived(""); setPayment("CASH"); setQuery("");
      setReload(value => value + 1);
      window.setTimeout(() => newSaleRef.current?.focus(), 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Encaissement impossible"); setReload(value => value + 1); }
    finally { setPaying(false); }
  }

  async function cancelSale(sale: Sale) {
    if (!window.confirm(`Annuler la vente n° ${sale.number} de ${formatMoney(sale.totalTTC)} ? Les produits seront remis en stock.`)) return;
    setError(""); setNotice("");
    try { await api(`/sales/${sale.id}/cancel`, { method: "POST" }); setNotice(`Vente n° ${sale.number} annulée, stock remis à jour`); setReload(value => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Annulation impossible"); }
  }

  function newSale() { setReceipt(null); window.setTimeout(() => searchRef.current?.focus(), 0); }

  if (receipt) return <>
    <PageHeader title="Point de vente" subtitle="Vente encaissée"/>
    <Receipt sale={receipt} pharmacy={user?.pharmacy?.name ?? "PharmaOS"}/>
    <div className="ph-ticket-actions ph-no-print">
      <button className="ph-btn ph-btn-secondary" type="button" onClick={() => window.print()}><Icon name="print" size={16}/>Imprimer le ticket</button>
      <button ref={newSaleRef} className="ph-btn ph-btn-primary" type="button" onClick={newSale}><Icon name="plus" size={16}/>Nouvelle vente</button>
    </div>
  </>;

  return <>
    <PageHeader title="Point de vente" subtitle="Recherchez un produit ou scannez son SKU, puis encaissez"/>
    {error && <Notice tone="error">{error}</Notice>}
    {notice && <Notice tone="success">{notice}</Notice>}

    <div className="ph-pos">
      <section className="ph-card" aria-labelledby="catalog-title">
        <h2 className="ph-sr" id="catalog-title">Produits</h2>
        <div className="ph-pos-search"><label className="ph-input-search"><Icon name="search" size={18}/><input ref={searchRef} autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onSearchKey} placeholder="Nom du produit ou SKU" aria-label="Rechercher un produit" aria-describedby="pos-search-hint"/><kbd className="ph-kbd">Entrée</kbd></label></div>
        <p className="ph-hint" id="pos-search-hint" style={{ margin: "8px 0 12px" }}>Entrée ajoute le premier produit disponible, ou le SKU exact</p>
        {tabs.length > 2 && <div className="ph-tabs" role="tablist" aria-label="Catégories">
          {tabs.map(item => <button key={item.id} type="button" role="tab" aria-selected={!searching && activeTab === item.id} className={!searching && activeTab === item.id ? "is-active" : ""} onClick={() => { setTab(item.id); setQuery(""); }}>
            {item.label}<span className="ph-tabs-count">{item.count}</span>
          </button>)}
        </div>}
        {searching && tabs.length > 2 && <p className="ph-hint" style={{ marginBottom: 12 }}>Recherche dans toutes les catégories · {results.length} résultat{results.length > 1 ? "s" : ""}</p>}
        {loading ? <LoadingRows/> : results.length ? <ul className="ph-tiles">{results.map(product => {
          const stock = stockOf(product);
          const count = inCart.get(product.id) ?? 0;
          const price = formatMoney(unitPriceTTC(Number(product.priceHT), Number(product.tvaRate)));
          return <li key={product.id}>
            <button type="button" className={`ph-tile ${count ? "is-in-cart" : ""}`} onClick={() => add(product)} disabled={stock <= 0} aria-label={`Ajouter ${product.name}, ${price}${stock <= 0 ? ", en rupture" : count ? `, ${count} dans le panier` : ""}`}>
              {count > 0 && <span className="ph-tile-count" aria-hidden="true">× {count}</span>}
              <span className="ph-tile-name">{product.name}</span>
              <span className="ph-tile-sku">{product.sku}</span>
              <span className="ph-tile-price">{price}</span>
              <span className="ph-tile-stock">{stock <= 0 ? <span className="ph-badge is-danger">Rupture</span> : <StockGauge quantity={stock - count} threshold={product.stockThreshold} small/>}</span>
            </button>
          </li>;
        })}</ul> : products.length ? <EmptyState icon="search" title="Aucun produit trouvé" text="Vérifiez l’orthographe ou le SKU."/> : <EmptyState icon="box" title="Aucun produit à vendre" text="Ajoutez des produits au catalogue et saisissez leur stock pour encaisser."/>}
      </section>

      <aside className="ph-cart" aria-labelledby="cart-title">
        <section className="ph-card">
          <div className="ph-card-head"><div><h2 className="ph-card-title" id="cart-title">Vente en cours</h2><p className="ph-card-meta">{itemCount ? `${itemCount} article${itemCount > 1 ? "s" : ""}` : "Panier vide"}</p></div>{lines.length > 0 && <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => setCart([])}>Vider</button>}</div>
          {lines.length ? <ul className="ph-cart-lines">{lines.map(line => <li key={line.product.id}>
            <span className="ph-cell-main"><b>{line.product.name}</b><small>{formatMoney(unitPriceTTC(Number(line.product.priceHT), Number(line.product.tvaRate)))} l’unité</small></span>
            <span className="ph-cart-line-total">{formatMoney(line.lineTTC)}</span>
            <span className="ph-cart-line-tools">
              <span className="ph-qty">
                <button type="button" onClick={() => setQuantity(line.product.id, line.quantity - 1)} aria-label={`Retirer un ${line.product.name}`}><Icon name="minus" size={14}/></button>
                <input type="number" min="1" max={stockOf(line.product)} value={line.quantity} onChange={event => setQuantity(line.product.id, Number(event.target.value))} aria-label={`Quantité de ${line.product.name}`}/>
                <button type="button" onClick={() => setQuantity(line.product.id, line.quantity + 1)} disabled={line.quantity >= stockOf(line.product)} aria-label={`Ajouter un ${line.product.name}`}><Icon name="plus" size={14}/></button>
              </span>
              <span className="ph-hint">{stockOf(line.product) - line.quantity} restant{stockOf(line.product) - line.quantity > 1 ? "s" : ""}</span>
              <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => setQuantity(line.product.id, 0)} aria-label={`Supprimer ${line.product.name} du panier`}><Icon name="trash" size={16}/></button>
            </span>
          </li>)}</ul> : <EmptyState icon="cart" title="Aucun article" text="Cliquez sur un produit pour l’ajouter."/>}
        </section>

        <section className="ph-card" aria-label="Paiement" id="pos-payment">
          <dl className="ph-totals">
            <div><dt>Total HT</dt><dd>{formatMoney(totals.totalHT)}</dd></div>
            <div><dt>TVA</dt><dd>{formatMoney(totals.totalTVA)}</dd></div>
          </dl>
          <div className="ph-total-due" style={{ marginTop: 12 }}><span>À payer</span><b>{formatMoney(totals.totalTTC)}</b></div>
          <div className="ph-form" style={{ marginTop: 16 }}>
            <div className="ph-segment ph-segment-block" role="group" aria-label="Mode de paiement">{(["CASH", "CARD"] as const).map(method => <button key={method} type="button" aria-pressed={payment === method} onClick={() => { setPayment(method); setReceived(""); }}>{PAYMENT_LABELS[method]}</button>)}</div>
            {payment === "CASH" && <>
              <label className="ph-field"><span>Montant reçu (FBu)</span><input type="number" min="0" step="1" inputMode="numeric" value={received} onChange={event => setReceived(event.target.value)} placeholder={totals.totalTTC ? String(totals.totalTTC) : "0"} disabled={!lines.length}/></label>
              {lines.length > 0 && <div className="ph-quick-amounts" role="group" aria-label="Montants rapides">
                <button type="button" className="ph-btn ph-btn-secondary ph-btn-sm" onClick={() => setReceived(String(totals.totalTTC))}>Montant exact</button>
                {quickAmounts(totals.totalTTC).map(value => <button key={value} type="button" className="ph-btn ph-btn-secondary ph-btn-sm ph-tabular" onClick={() => setReceived(String(value))}>{formatMoney(value)}</button>)}
              </div>}
              {change !== null && <div className={`ph-change ${short ? "is-short" : ""}`} aria-live="polite"><span>{short ? "Il manque" : "À rendre"}</span><b>{formatMoney(Math.abs(change))}</b></div>}
            </>}
            <button type="button" className="ph-btn ph-btn-primary ph-btn-lg ph-btn-block" onClick={checkout} disabled={!lines.length || paying || short}>{paying ? "Encaissement…" : lines.length ? `Encaisser ${formatMoney(totals.totalTTC)}` : "Encaisser"}</button>
          </div>
        </section>
      </aside>
    </div>

    {/* Sur mobile, le total reste visible pendant que le vendeur parcourt la grille. */}
    {lines.length > 0 && <div className="ph-pos-bar" aria-hidden="true">
      <span><small>{itemCount} article{itemCount > 1 ? "s" : ""}</small><b>{formatMoney(totals.totalTTC)}</b></span>
      <a className="ph-btn ph-btn-primary" href="#pos-payment" tabIndex={-1}>Payer</a>
    </div>}

    <section className="ph-card ph-card-flush" aria-labelledby="recent-title">
      <div className="ph-card-head"><h2 className="ph-card-title" id="recent-title">Dernières ventes</h2><p className="ph-card-meta">Les 8 plus récentes</p></div>
      {loading ? <LoadingRows rows={3}/> : sales.length ? <div className="ph-table-wrap"><table className="ph-table">
        <thead><tr><th>Vente</th><th className="ph-hide-sm">Articles</th><th className="ph-hide-sm">Paiement</th><th className="ph-num">Total</th><th>Statut</th><th><span className="ph-sr">Actions</span></th></tr></thead>
        <tbody>{sales.map(sale => <tr key={sale.id}>
          <td><span className="ph-cell-main"><b>N° {sale.number}</b><small>{formatDateTime(sale.createdAt)}{sale.cashier ? ` · ${sale.cashier.firstName}` : ""}</small></span></td>
          <td className="ph-hide-sm">{sale.items.map(item => `${item.quantity} × ${item.productName}`).join(", ")}</td>
          <td className="ph-hide-sm">{PAYMENT_LABELS[sale.paymentMethod]}</td>
          <td className="ph-num">{formatMoney(sale.totalTTC)}</td>
          <td><span className={`ph-badge ${sale.status === "COMPLETED" ? "is-ok" : "is-muted"}`}>{sale.status === "COMPLETED" ? "Encaissée" : `Annulée à ${formatTime(sale.cancelledAt ?? sale.createdAt)}`}</span></td>
          <td><div className="ph-row-actions">
            <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => setReceipt(sale)}>Ticket</button>
            {canManage(user) && sale.status === "COMPLETED" && <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => cancelSale(sale)}>Annuler</button>}
          </div></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState icon="receipt" title="Aucune vente encaissée" text="Les ventes de la caisse apparaîtront ici."/>}
    </section>
  </>;
}

export function Receipt({ sale, pharmacy }: { sale: Sale; pharmacy: string }) {
  return <article className="ph-ticket" aria-label={`Ticket de la vente n° ${sale.number}`}>
    {sale.status === "COMPLETED" ? <p className="ph-ticket-done ph-no-print"><i><Icon name="check" size={14}/></i>Vente encaissée</p> : <p className="ph-ticket-done ph-no-print" style={{ color: "var(--ph-text-2)" }}>Vente annulée</p>}
    <header className="ph-ticket-head"><b>{pharmacy}</b><span>Vente n° {sale.number} · {formatDateTime(sale.createdAt)}</span>{sale.cashier && <span>Servi par {sale.cashier.firstName} {sale.cashier.lastName}</span>}</header>
    <ul className="ph-ticket-lines">{sale.items.map(item => <li key={item.id}>
      <span>{item.productName}</span>
      <span className="ph-num">{formatMoney(item.lineTTC)}</span>
      <small>{item.quantity} × {formatMoney(unitPriceTTC(item.unitPriceHT, item.tvaRate))} · TVA {item.tvaRate} %</small>
    </li>)}</ul>
    <dl className="ph-totals">
      <div><dt>Total HT</dt><dd>{formatMoney(sale.totalHT)}</dd></div>
      <div><dt>TVA</dt><dd>{formatMoney(sale.totalTVA)}</dd></div>
      <div className="ph-total-due"><span>Total TTC</span><b>{formatMoney(sale.totalTTC)}</b></div>
      <div><dt>{PAYMENT_LABELS[sale.paymentMethod]}{sale.amountReceived !== null ? " reçu" : ""}</dt><dd>{formatMoney(sale.amountReceived ?? sale.totalTTC)}</dd></div>
      {sale.change !== null && sale.change > 0 && <div><dt>Rendu</dt><dd>{formatMoney(sale.change)}</dd></div>}
    </dl>
    <p className="ph-ticket-foot">Merci de votre visite</p>
  </article>;
}
