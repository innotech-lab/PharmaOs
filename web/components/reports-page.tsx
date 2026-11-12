"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReportSummary, Sale } from "@pharmaos/shared";
import { TopProducts } from "./dashboard-home";
import { RevenueChart } from "./revenue-chart";
import { Delta, EmptyState, LoadingRows, Notice, PageHeader } from "./ui";
import { api } from "../lib/api";
import { browserTimeZone, compare, formatDateTime, formatMoney, formatNumber, PAYMENT_LABELS } from "../lib/format";

const periods = [7, 30] as const;

export function ReportsPage() {
  const [days, setDays] = useState<(typeof periods)[number]>(30);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setReport(null);
    api<ReportSummary>(`/reports/summary?days=${days}&timeZone=${encodeURIComponent(browserTimeZone())}`).then(data => { if (active) setReport(data); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Rapport indisponible"); });
    return () => { active = false; };
  }, [days]);

  useEffect(() => {
    let active = true;
    api<Sale[]>("/sales?limit=20").then(data => { if (active) setSales(data); }).catch(() => { if (active) setSales([]); });
    return () => { active = false; };
  }, []);

  const reference = days === 7 ? "les 7 jours précédents" : "les 30 jours précédents";
  const revenueDelta = report ? compare(report.period.revenueTTC, report.previousPeriod.revenueTTC) : null;
  const countDelta = report ? compare(report.period.salesCount, report.previousPeriod.salesCount) : null;
  const previousAverage = report && report.previousPeriod.salesCount ? report.previousPeriod.revenueTTC / report.previousPeriod.salesCount : 0;
  const averageDelta = report ? compare(report.period.averageTTC, previousAverage) : null;

  return <>
    <PageHeader title="Rapports" subtitle="Le chiffre d’affaires encaissé, les produits qui le portent et les dernières ventes">
      <div className="ph-segment" role="group" aria-label="Période">{periods.map(value => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{value} jours</button>)}</div>
    </PageHeader>
    {error && <Notice tone="error">{error}</Notice>}

    <section className="ph-stats" aria-label={`Indicateurs sur ${days} jours`}>
      <article className="ph-stat"><p className="ph-stat-label">Chiffre d’affaires, {days} jours</p><p className="ph-stat-value">{report ? formatMoney(report.period.revenueTTC) : "—"}</p>{revenueDelta ? <Delta tone={revenueDelta.tone} text={revenueDelta.text} reference={reference}/> : <p className="ph-stat-delta">Chargement…</p>}</article>
      <article className="ph-stat"><p className="ph-stat-label">Ventes encaissées</p><p className="ph-stat-value">{report ? formatNumber(report.period.salesCount) : "—"}</p>{countDelta ? <Delta tone={countDelta.tone} text={countDelta.text} reference={reference}/> : <p className="ph-stat-delta">Chargement…</p>}</article>
      <article className="ph-stat"><p className="ph-stat-label">Panier moyen</p><p className="ph-stat-value">{report ? formatMoney(report.period.averageTTC) : "—"}</p>{averageDelta ? <Delta tone={averageDelta.tone} text={averageDelta.text} reference={reference}/> : <p className="ph-stat-delta">Chargement…</p>}</article>
      <article className="ph-stat"><p className="ph-stat-label">Aujourd’hui</p><p className="ph-stat-value">{report ? formatMoney(report.today.revenueTTC) : "—"}</p><p className="ph-stat-delta">{report ? `${formatNumber(report.today.salesCount)} vente${report.today.salesCount > 1 ? "s" : ""}` : "Chargement…"}</p></article>
    </section>

    <section className="ph-card" aria-labelledby="daily-title">
      <div className="ph-card-head"><div><h2 className="ph-card-title" id="daily-title">Chiffre d’affaires par jour</h2><p className="ph-card-meta">Ventes encaissées TTC, hors annulations</p></div><p className="ph-chart-legend"><span><i style={{ background: "var(--ph-accent)" }}/>Aujourd’hui</span><span><i style={{ background: "var(--ph-bar)" }}/>Jours précédents</span></p></div>
      {!report ? <LoadingRows/> : report.period.salesCount ? <RevenueChart days={report.daily}/> : <EmptyState icon="chart" title="Aucune vente sur la période" text="Les ventes encaissées au point de vente s’afficheront ici."><Link className="ph-btn ph-btn-secondary" href="/pos">Ouvrir la caisse</Link></EmptyState>}
    </section>

    <div className="ph-grid-main">
      <section className="ph-card ph-card-flush" aria-labelledby="sales-title">
        <div className="ph-card-head"><h2 className="ph-card-title" id="sales-title">Dernières ventes</h2><p className="ph-card-meta">Les 20 plus récentes</p></div>
        {!sales ? <LoadingRows/> : sales.length ? <div className="ph-table-wrap"><table className="ph-table">
          <thead><tr><th>Vente</th><th className="ph-num ph-hide-sm">Articles</th><th className="ph-hide-sm">Paiement</th><th className="ph-num">Total TTC</th><th>Statut</th></tr></thead>
          <tbody>{sales.map(sale => <tr key={sale.id}>
            <td><span className="ph-cell-main"><b>N° {sale.number}</b><small>{formatDateTime(sale.createdAt)}{sale.cashier ? ` · ${sale.cashier.firstName}` : ""}</small></span></td>
            <td className="ph-num ph-hide-sm">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td className="ph-hide-sm">{PAYMENT_LABELS[sale.paymentMethod]}</td>
            <td className="ph-num">{formatMoney(sale.totalTTC)}</td>
            <td><span className={`ph-badge ${sale.status === "COMPLETED" ? "is-ok" : "is-muted"}`}>{sale.status === "COMPLETED" ? "Encaissée" : "Annulée"}</span></td>
          </tr>)}</tbody>
        </table></div> : <EmptyState icon="receipt" title="Aucune vente" text="Les ventes encaissées apparaîtront ici."/>}
      </section>

      <section className="ph-card" aria-labelledby="top-title">
        <div className="ph-card-head"><div><h2 className="ph-card-title" id="top-title">Produits les plus vendus</h2><p className="ph-card-meta">{days} derniers jours</p></div></div>
        {!report ? <LoadingRows rows={3}/> : report.topProducts.length ? <TopProducts items={report.topProducts}/> : <EmptyState icon="box" title="Pas encore de classement"/>}
      </section>
    </div>
  </>;
}
