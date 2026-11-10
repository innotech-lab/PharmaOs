"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { catalogue, type ProductRecord, type SupplierRecord } from "../lib/catalogue";

export function DashboardHome() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);

  useEffect(() => {
    const sync = () => { setProducts(catalogue.products()); setSuppliers(catalogue.suppliers()); };
    sync();
    return catalogue.subscribe(sync);
  }, []);

  const lowStock = products.filter(product => product.stockThreshold && Number(product.stockThreshold) > 0);
  const indicators = [
    { label: "Produits au catalogue", value: products.length, icon: "box" as const, tone: "teal", href: "/products" },
    { label: "Fournisseurs", value: suppliers.length, icon: "supplier" as const, tone: "blue", href: "/suppliers" },
    { label: "Produits actifs", value: products.filter(product => product.active).length, icon: "check" as const, tone: "violet", href: "/products" },
    { label: "Seuils de stock définis", value: lowStock.length, icon: "stock" as const, tone: "amber", href: "/inventory" },
  ];

  return <>
    <div className="page-heading"><h1>Tableau de bord</h1></div>
    <section className="kpi-grid" aria-label="Résumé du catalogue et des fournisseurs">
      {indicators.map(item => <Link key={item.label} href={item.href} className="kpi-card"><div className={`kpi-icon ${item.tone}`}><Icon name={item.icon} size={19}/></div><div className="kpi-label">{item.label}</div><div className="kpi-value">{item.value}</div></Link>)}
    </section>
    <section className="analytics-grid">
      <article className="panel revenue-panel"><div className="panel-head"><div><div className="section-label">CATALOGUE</div><h2>Produits récemment ajoutés</h2></div><Link href="/products" className="text-link">Voir le catalogue <Icon name="arrow" size={15}/></Link></div>
        {products.length ? <div className="stock-list">{products.slice(0, 5).map((product, index) => <div className="stock-row" key={product.sku}><span className={`product-avatar product-tone-${index % 4}`}>{product.name.slice(0, 1).toUpperCase()}</span><span className="stock-product"><b>{product.name}</b><small>Réf. {product.sku}</small></span><span className="stock-level"><b>{Number(product.unitPrice).toLocaleString("fr-FR")} <small>FBU</small></b></span></div>)}</div> : <div className="dashboard-empty"><Icon name="box" size={21}/><span>Aucun produit. Ajoutez votre premier article au catalogue.</span><Link href="/products" className="text-link">Ajouter un produit <Icon name="arrow" size={15}/></Link></div>}
      </article>
      <article className="panel stock-panel"><div className="panel-head"><div><div className="section-label">FOURNISSEURS</div><h2>Partenaires enregistrés</h2></div><Link href="/suppliers" className="text-link">Annuaire <Icon name="arrow" size={15}/></Link></div>
        {suppliers.length ? <div className="stock-list">{suppliers.slice(0, 5).map((supplier, index) => <div className="stock-row" key={`${supplier.email}-${index}`}><span className="product-avatar product-tone-2">{supplier.name.slice(0, 1).toUpperCase()}</span><span className="stock-product"><b>{supplier.name}</b><small>{supplier.category}</small></span><span className={`status-badge ${supplier.active ? "status-active" : "status-inactive"}`}><i/>{supplier.active ? "Actif" : "Inactif"}</span></div>)}</div> : <div className="dashboard-empty"><Icon name="supplier" size={21}/><span>Aucun fournisseur. Enregistrez vos partenaires pour les retrouver ici.</span><Link href="/suppliers" className="text-link">Ajouter un fournisseur <Icon name="arrow" size={15}/></Link></div>}
      </article>
    </section>
    <section className="panel products-panel"><div className="panel-head"><div><div className="section-label">ACTIVITÉ</div><h2>Résumé de l’officine</h2></div></div><p className="dashboard-note">Les ventes et les niveaux de stock apparaîtront ici lorsque les modules correspondants seront connectés à la base de données.</p></section>
  </>;
}
