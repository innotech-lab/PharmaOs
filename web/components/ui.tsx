"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { formatLongDate } from "../lib/format";

export function PageHeader({ title, subtitle, eyebrow, children }: { title: string; subtitle?: string; eyebrow?: string; children?: React.ReactNode }) {
  return <header className="ph-page-head">
    <div>
      <p className="ph-eyebrow">{eyebrow ?? formatLongDate()}</p>
      <h1 className="ph-title">{title}</h1>
      {subtitle && <p className="ph-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="ph-head-actions">{children}</div>}
  </header>;
}

// Signature : la quantité en stock face à son seuil d'alerte.
export function StockGauge({ quantity, threshold, small = false }: { quantity: number; threshold: number; small?: boolean }) {
  const scale = Math.max(threshold * 2, quantity, 1);
  const state = quantity <= 0 ? "is-out" : quantity <= threshold ? "is-low" : "is-ok";
  const label = quantity <= 0 ? "Rupture" : quantity <= threshold ? "Sous le seuil" : "En stock";
  return <span className={`ph-gauge ${state} ${small ? "ph-gauge-sm" : ""}`} title={`${label} · seuil ${threshold}`}>
    <span className="ph-gauge-value ph-num">{quantity}</span>
    <span className="ph-gauge-track" aria-hidden="true">
      <span className="ph-gauge-fill" style={{ width: `${Math.min(100, (Math.max(quantity, 0) / scale) * 100)}%` }}/>
      {threshold > 0 && <span className="ph-gauge-mark" style={{ left: `calc(${(threshold / scale) * 100}% - 1px)` }}/>}
    </span>
    <span className="ph-sr">{label}, seuil d’alerte {threshold}</span>
  </span>;
}

export function stockStatus(quantity: number, threshold: number) {
  if (quantity <= 0) return { tone: "is-danger", label: "Rupture" };
  if (quantity <= threshold) return { tone: "is-warn", label: "Sous le seuil" };
  return { tone: "is-ok", label: "En stock" };
}

export function Notice({ tone, children, action }: { tone: "success" | "error"; children: React.ReactNode; action?: { href: string; label: string } }) {
  return <div className={`ph-notice is-${tone}`} role={tone === "error" ? "alert" : "status"}>
    <Icon name={tone === "success" ? "check" : "close"} size={16}/>
    <span>{children}</span>
    {action && <Link className="ph-link" href={action.href}>{action.label}</Link>}
  </div>;
}

export function EmptyState({ icon, title, text, children }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; text?: string; children?: React.ReactNode }) {
  return <div className="ph-empty">
    <span className="ph-empty-icon"><Icon name={icon} size={22}/></span>
    <b>{title}</b>
    {text && <p>{text}</p>}
    {children}
  </div>;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return <div className="ph-empty" role="status" aria-label="Chargement">
    {Array.from({ length: rows }, (_, index) => <span key={index} className="ph-skeleton" style={{ width: `${88 - index * 12}%` }}/>)}
  </div>;
}

export function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="ph-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="ph-modal" role="dialog" aria-modal="true" aria-labelledby="ph-modal-title">
      <div className="ph-modal-head">
        <div><h2 id="ph-modal-title">{title}</h2>{description && <p>{description}</p>}</div>
        <button type="button" className="ph-icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="close" size={18}/></button>
      </div>
      {children}
    </section>
  </div>;
}

export function Delta({ tone, text, reference }: { tone: "up" | "down" | "flat"; text: string; reference: string }) {
  // Sans valeur de référence, on le dit au lieu d'afficher une variation inventée.
  if (!text) return <p className="ph-stat-delta">Aucune vente {reference}</p>;
  return <p className="ph-stat-delta"><b className={tone === "up" ? "is-up" : tone === "down" ? "is-down" : ""}>{text}</b> vs {reference}</p>;
}
