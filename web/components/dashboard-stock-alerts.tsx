"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Icon } from "./icons";

type LowStockProduct = {
  productId: string;
  productName: string;
  sku: string;
  stockThreshold: number;
  quantity: number;
  lowStock: boolean;
};

export function DashboardStockAlerts() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    api<LowStockProduct[]>("/inventory/levels")
      .then(levels => {
        if (current) setProducts(levels.filter(product => product.lowStock).slice(0, 5));
      })
      .catch(reason => {
        if (current) setError(reason instanceof Error ? reason.message : "Alertes indisponibles");
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  if (loading) {
    return <div className="stock-list" role="status" aria-label="Chargement des alertes de stock">
      <div className="stock-skeleton"><div><span className="skeleton sk-stock-name"/><span className="skeleton sk-stock-count"/></div></div>
    </div>;
  }

  if (error) {
    return <p className="dashboard-stock-error" role="alert">{error}</p>;
  }

  if (!products.length) {
    return <div className="dashboard-empty"><Icon name="check" size={21}/><span>Aucun produit sous son seuil</span></div>;
  }

  return <div className="stock-list" aria-label="Produits sous le seuil de stock">
    {products.map(product => <div className="stock-row" key={product.productId}>
      <span className="stock-product">
        <b>{product.productName}</b>
        <small>{product.sku} · Seuil {product.stockThreshold}</small>
      </span>
      <span className="stock-level">
        <b>{product.quantity} <small>unités</small></b>
        <span className="stock-alert-label">Stock bas</span>
      </span>
    </div>)}
    {products.length === 5 && <Link href="/inventory" className="stock-footer">Voir l’inventaire <Icon name="arrow" size={14}/></Link>}
  </div>;
}
