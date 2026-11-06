import Link from "next/link";
import { Icon } from "./icons";

const indicators = [
  { label: "Chiffre d’affaires", icon: "chart" as const, tone: "teal" },
  { label: "Ventes aujourd’hui", icon: "cart" as const, tone: "blue" },
  { label: "Produits en stock", icon: "box" as const, tone: "violet" },
  { label: "À réapprovisionner", icon: "stock" as const, tone: "amber" },
];

export function DashboardHome() {
  return <>
    <div className="page-heading"><h1>Tableau de bord</h1></div>
    <section className="kpi-grid" aria-label="Indicateurs clés">
      {indicators.map(item => <article key={item.label} className="kpi-card"><div className={`kpi-icon ${item.tone}`}><Icon name={item.icon} size={19}/></div><div className="kpi-label">{item.label}</div><div className="kpi-value">—</div></article>)}
    </section>
    <section className="analytics-grid">
      <article className="panel revenue-panel"><div className="panel-head"><div><div className="section-label">VENTES</div><h2>Chiffre d’affaires</h2></div></div><div className="dashboard-empty"><Icon name="chart" size={21}/><span>Aucune donnée disponible</span></div></article>
      <article className="panel stock-panel"><div className="panel-head"><div><div className="section-label">STOCK</div><h2>À réapprovisionner</h2></div><Link href="/inventory" className="text-link">Inventaire <Icon name="arrow" size={15}/></Link></div><div className="dashboard-empty"><Icon name="check" size={21}/><span>Aucun produit affiché</span></div></article>
    </section>
    <section className="panel products-panel"><div className="panel-head"><div><div className="section-label">CATALOGUE</div><h2>Produits les plus vendus</h2></div><Link href="/products" className="text-link">Produits <Icon name="arrow" size={15}/></Link></div><div className="dashboard-empty dashboard-empty-inline"><Icon name="box" size={20}/><span>Aucune donnée disponible</span></div></section>
  </>;
}
