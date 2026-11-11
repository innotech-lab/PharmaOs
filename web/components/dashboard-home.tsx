"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { api } from "../lib/api";
import { DashboardStockAlerts } from "./dashboard-stock-alerts";

const indicators = [
  { label: "Chiffre d’affaires", icon: "chart" as const, tone: "teal" },
  { label: "Ventes aujourd’hui", icon: "cart" as const, tone: "blue" },
  { label: "Produits en stock", icon: "box" as const, tone: "violet" },
  { label: "À réapprovisionner", icon: "stock" as const, tone: "amber" },
];

export function DashboardHome() {
  const [levels, setLevels] = useState<{ quantity: number; lowStock: boolean }[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<{ quantity: number; lowStock: boolean }[]>("/inventory/levels").then(data => { if (active) setLevels(data); }).catch(() => { if (active) setError("Impossible de charger les indicateurs de stock."); });
    return () => { active = false; };
  }, []);
  return <>
    <div className="page-heading"><h1>Tableau de bord</h1></div>
    {error && <p role="alert">{error}</p>}
    <section className="kpi-grid" aria-label="Indicateurs clés">
      {indicators.map((item, index) => <article key={item.label} className="kpi-card"><div className={`kpi-icon ${item.tone}`}><Icon name={item.icon} size={19}/></div><div className="kpi-label">{item.label}</div><div className="kpi-value">{levels && index === 2 ? levels.filter(p => p.quantity > 0).length : levels && index === 3 ? levels.filter(p => p.lowStock).length : "—"}</div></article>)}
    </section>
    <section className="analytics-grid">
      <article className="panel revenue-panel"><div className="panel-head"><div><div className="section-label">VENTES</div><h2>Chiffre d’affaires</h2></div></div><div className="dashboard-empty"><Icon name="chart" size={21}/><span>Aucune donnée disponible</span></div></article>
      <article className="panel stock-panel"><div className="panel-head"><div><div className="section-label">STOCK</div><h2>À réapprovisionner</h2></div><Link href="/inventory" className="text-link">Inventaire <Icon name="arrow" size={15}/></Link></div><DashboardStockAlerts /></article>
    </section>
    <section className="panel products-panel"><div className="panel-head"><div><div className="section-label">CATALOGUE</div><h2>Produits les plus vendus</h2></div><Link href="/products" className="text-link">Produits <Icon name="arrow" size={15}/></Link></div><div className="dashboard-empty dashboard-empty-inline"><Icon name="box" size={20}/><span>Aucune donnée disponible</span></div></section>
  </>;
}
