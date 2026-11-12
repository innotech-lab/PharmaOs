"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InventoryLevel, ReportSummary } from "@pharmaos/shared";
import { Icon } from "./icons";
import { RevenueChart } from "./revenue-chart";
import { Delta, EmptyState, LoadingRows, PageHeader, StockGauge } from "./ui";
import { api } from "../lib/api";
import { browserTimeZone, compare, formatMoney, formatNumber } from "../lib/format";
import { useCurrentUser } from "../lib/session";

const hiddenKey = "pharmaos:onboarding-hidden";

export function DashboardHome() {
  const user = useCurrentUser();
  const [levels, setLevels] = useState<InventoryLevel[] | null>(null);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [onboardingHidden, setOnboardingHidden] = useState(true);

  useEffect(() => {
    let active = true;
    try { setOnboardingHidden(localStorage.getItem(hiddenKey) === "1"); } catch { setOnboardingHidden(false); }
    api<InventoryLevel[]>("/inventory/levels").then(data => { if (active) setLevels(data); }).catch(() => { if (active) setError("Impossible de charger le stock"); });
    api<ReportSummary>(`/reports/summary?days=14&timeZone=${encodeURIComponent(browserTimeZone())}`).then(data => { if (active) setReport(data); }).catch(() => { if (active) setError("Impossible de charger les ventes"); });
    api<{ id: string }[]>("/users").then(users => { if (active) setTeamSize(users.length); }).catch(() => { /* la liste de démarrage reste masquée */ });
    return () => { active = false; };
  }, []);

  const lowStock = (levels ?? []).filter(level => level.lowStock).sort((a, b) => a.quantity - b.quantity);
  const today = report?.today;
  const revenueDelta = report ? compare(report.today.revenueTTC, report.yesterday.revenueTTC) : null;
  const countDelta = report ? compare(report.today.salesCount, report.yesterday.salesCount) : null;

  return <>
    <PageHeader title="Vue d’ensemble" subtitle="L’activité de la journée et les produits à réapprovisionner">
      <Link className="ph-btn ph-btn-primary" href="/pos"><Icon name="cart" size={16}/>Nouvelle vente</Link>
    </PageHeader>
    {error && <p className="ph-notice is-error" role="alert">{error}</p>}

    {user?.role === "OWNER" && !onboardingHidden && levels && teamSize !== null && report &&
      <Onboarding levels={levels} teamSize={teamSize} salesCount={report.period.salesCount + report.previousPeriod.salesCount} onHide={() => { try { localStorage.setItem(hiddenKey, "1"); } catch { /* masqué pour cette visite */ } setOnboardingHidden(true); }}/>}

    <section className="ph-stats" aria-label="Indicateurs du jour">
      <article className="ph-stat"><p className="ph-stat-label">Chiffre d’affaires du jour</p><p className="ph-stat-value">{today ? formatMoney(today.revenueTTC) : "—"}</p>{revenueDelta ? <Delta tone={revenueDelta.tone} text={revenueDelta.text} reference="hier"/> : <p className="ph-stat-delta">Chargement…</p>}</article>
      <article className="ph-stat"><p className="ph-stat-label">Ventes du jour</p><p className="ph-stat-value">{today ? formatNumber(today.salesCount) : "—"}</p>{countDelta ? <Delta tone={countDelta.tone} text={countDelta.text} reference="hier"/> : <p className="ph-stat-delta">Chargement…</p>}</article>
      <article className="ph-stat"><p className="ph-stat-label">Panier moyen, 14 jours</p><p className="ph-stat-value">{report ? formatMoney(report.period.averageTTC) : "—"}</p><p className="ph-stat-delta">{report ? `${formatNumber(report.period.salesCount)} ventes sur la période` : "Chargement…"}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Produits sous le seuil</p><p className="ph-stat-value">{levels ? formatNumber(lowStock.length) : "—"}<small>/ {levels ? formatNumber(levels.length) : "—"}</small></p><p className="ph-stat-delta">{levels ? lowStock.length ? <b className="is-warn">À commander</b> : "Tout est au-dessus du seuil" : "Chargement…"}</p></article>
    </section>

    <div className="ph-grid-main">
      <section className="ph-card" aria-labelledby="revenue-title">
        <div className="ph-card-head"><div><h2 className="ph-card-title" id="revenue-title">Chiffre d’affaires, 14 derniers jours</h2><p className="ph-card-meta">{report ? `${formatMoney(report.period.revenueTTC)} encaissés` : "Chargement…"}</p></div><Link className="ph-link" href="/reports">Rapports</Link></div>
        {!report ? <LoadingRows/> : report.period.salesCount ? <RevenueChart days={report.daily}/> : <EmptyState icon="chart" title="Aucune vente sur la période" text="Le chiffre d’affaires s’affiche ici dès la première vente encaissée."><Link className="ph-btn ph-btn-secondary" href="/pos">Ouvrir la caisse</Link></EmptyState>}
      </section>

      <section className="ph-card" aria-labelledby="restock-title">
        <div className="ph-card-head"><div><h2 className="ph-card-title" id="restock-title">À réapprovisionner</h2><p className="ph-card-meta">Stock actuel face au seuil d’alerte</p></div><Link className="ph-link" href="/inventory">Inventaire</Link></div>
        {!levels ? <LoadingRows rows={3}/> : lowStock.length ? <ul className="ph-alerts">{lowStock.slice(0, 6).map(level => <li key={level.productId}>
          <span className="ph-cell-main"><b>{level.productName}</b><small>{level.sku} · seuil {level.stockThreshold}</small></span>
          <StockGauge quantity={level.quantity} threshold={level.stockThreshold} small/>
          <Link className="ph-btn ph-btn-secondary ph-btn-sm" href={`/inventory?product=${level.productId}`}>Ajuster</Link>
        </li>)}</ul> : <EmptyState icon="check" title="Rien à commander" text={levels.length ? "Tous les produits sont au-dessus de leur seuil d’alerte." : "Ajoutez vos produits pour suivre leur stock."}/>}
        {lowStock.length > 6 && <p className="ph-card-meta" style={{ marginTop: 12 }}><Link className="ph-link" href="/inventory">Voir les {lowStock.length} produits</Link></p>}
      </section>
    </div>

    <section className="ph-card" aria-labelledby="top-title">
      <div className="ph-card-head"><div><h2 className="ph-card-title" id="top-title">Produits les plus vendus</h2><p className="ph-card-meta">14 derniers jours, en chiffre d’affaires</p></div></div>
      {!report ? <LoadingRows rows={3}/> : report.topProducts.length ? <TopProducts items={report.topProducts}/> : <EmptyState icon="box" title="Pas encore de classement" text="Les produits vendus apparaîtront ici."/>}
    </section>
  </>;
}

export function TopProducts({ items }: { items: ReportSummary["topProducts"] }) {
  const max = Math.max(...items.map(item => item.revenueTTC), 1);
  return <ol className="ph-rank">{items.map((item, index) => <li key={item.productId}>
    <span className="ph-rank-pos">{index + 1}</span>
    <span className="ph-rank-name">{item.productName}</span>
    <span className="ph-rank-value">{formatMoney(item.revenueTTC)}</span>
    <span className="ph-rank-bar" aria-hidden="true"><i style={{ width: `${(item.revenueTTC / max) * 100}%` }}/></span>
    <span className="ph-rank-meta">{formatNumber(item.quantity)} unité{item.quantity > 1 ? "s" : ""} vendue{item.quantity > 1 ? "s" : ""}</span>
  </li>)}</ol>;
}

// Liste de démarrage du titulaire : chaque étape est cochée d'après les données réelles de l'officine.
function Onboarding({ levels, teamSize, salesCount, onHide }: { levels: InventoryLevel[]; teamSize: number; salesCount: number; onHide: () => void }) {
  const steps = [
    { label: "Créer votre espace", done: true, href: "/", action: "" },
    { label: "Ajouter un premier produit", done: levels.length > 0, href: "/products", action: "Ajouter un produit" },
    { label: "Saisir le stock d’un produit", done: levels.some(level => level.quantity > 0), href: "/inventory", action: "Saisir le stock" },
    { label: "Encaisser une première vente", done: salesCount > 0, href: "/pos", action: "Ouvrir la caisse" },
    { label: "Ajouter un membre de l’équipe", done: teamSize > 1, href: "/users", action: "Ajouter un membre" },
  ];
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;
  const next = steps.find(step => !step.done);
  return <section className="ph-card" aria-labelledby="onboarding-title">
    <div className="ph-card-head"><div><h2 className="ph-card-title" id="onboarding-title">Mettez votre officine en route</h2><p className="ph-card-meta">Quelques minutes pour être prêt à encaisser</p></div><button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={onHide}>Masquer</button></div>
    <div className="ph-progress"><span>{done} étape{done > 1 ? "s" : ""} sur {steps.length}</span><div className="ph-progress-track" role="progressbar" aria-label="Progression du démarrage" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}><i style={{ width: `${(done / steps.length) * 100}%` }}/></div></div>
    <ol className="ph-steps">{steps.map(step => <li key={step.label} className={step.done ? "is-done" : step === next ? "is-next" : ""}>
      <span className="ph-step-check" aria-hidden="true">{step.done && <Icon name="check" size={12}/>}</span>
      <span className="ph-step-label">{step.label}{step.done && <span className="ph-sr"> — terminé</span>}</span>
      {step === next && <Link className="ph-btn ph-btn-primary ph-btn-sm" href={step.href}>{step.action}</Link>}
    </li>)}</ol>
  </section>;
}
