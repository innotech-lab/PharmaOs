"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryLevel } from "@pharmaos/shared";
import { AnimatedLogo } from "./animated-logo";
import { Icon } from "./icons";
import { api, authApi, type CurrentUser } from "../lib/api";
import { initials, ROLE_LABELS } from "../lib/format";
import { SessionContext } from "../lib/session";

const links = [
  { label: "Vue d’ensemble", href: "/", icon: "dashboard" as const },
  { label: "Produits", href: "/products", icon: "box" as const },
  { label: "Inventaire", href: "/inventory", icon: "stock" as const },
  { label: "Point de vente", href: "/pos", icon: "cart" as const },
  { label: "Fournisseurs", href: "/suppliers", icon: "supplier" as const },
  { label: "Rapports", href: "/reports", icon: "chart" as const },
  { label: "Équipe", href: "/users", icon: "users" as const },
];
const allPages = [...links, { label: "Paramètres", href: "/settings", icon: "settings" as const }];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [profileError, setProfileError] = useState("");
  const [lowStock, setLowStock] = useState<InventoryLevel[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => allPages.filter(item => item.label.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  const current = allPages.find(item => item.href === pathname);

  useEffect(() => {
    let active = true;
    authApi.me().then(user => { if (!active) return; setProfile(user); if (user.mustChangePassword && window.location.pathname !== "/change-password") router.replace("/change-password"); }).catch(() => { if (active) setProfileError("Compte indisponible"); });
    const cleanupMarker = "pharmaos:demo-data-removed-v1";
    try {
      if (!localStorage.getItem(cleanupMarker)) {
        ["pharmaos:suppliers", "pharmaos:pharmacies", "pharmaos:active-pharmacy"].forEach(key => localStorage.removeItem(key));
        localStorage.setItem(cleanupMarker, "1");
      }
    } catch { /* stockage local indisponible */ }
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); searchRef.current?.focus(); }
      if (event.key === "Escape") { setSearchOpen(false); setNotificationsOpen(false); setMobileOpen(false); }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!searchWrapRef.current?.contains(target)) setSearchOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { active = false; window.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, []);

  // Les alertes de stock se rafraîchissent à chaque changement de page (après une vente ou un ajustement).
  useEffect(() => {
    let active = true;
    api<InventoryLevel[]>("/inventory/levels").then(levels => { if (active) setLowStock(levels.filter(level => level.lowStock)); }).catch(() => { /* alertes indisponibles */ });
    setMobileOpen(false);
    return () => { active = false; };
  }, [pathname]);

  async function logout() {
    setLoggingOut(true); setProfileError("");
    try {
      await authApi.logout();
      try { ["pharmaos:access-token", "pharmaos:refresh-token"].forEach(key => localStorage.removeItem(key)); } catch { /* rien à nettoyer */ }
      window.location.assign("/login");
    } catch {
      setProfileError("Déconnexion impossible, réessayez");
      setLoggingOut(false);
    }
  }

  const pharmacy = profile?.pharmacy;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Compte";

  return <SessionContext.Provider value={profile}>
    <div className="ph-app">
      <aside id="ph-sidebar" className={`ph-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link className="ph-brand" href="/" aria-label="PharmaOS, vue d’ensemble"><span className="ph-brand-mark"><AnimatedLogo /></span><span className="ph-brand-name">Pharma<span>OS</span></span></Link>

        <div className="ph-pharmacy">
          <div className="ph-pharmacy-button" aria-disabled="true" title={pharmacy ? "Pharmacie active" : undefined}>
            <span className="ph-avatar">{pharmacy ? initials(pharmacy.name) : "—"}</span>
            <span className="ph-pharmacy-copy"><b>{pharmacy?.name ?? (profile ? "Aucune pharmacie" : "Chargement…")}</b><small>{pharmacy ? [pharmacy.city, pharmacy.country].filter(Boolean).join(", ") || "Pharmacie active" : "Aucune officine liée"}</small></span>
          </div>
        </div>

        <nav className="ph-nav-group" aria-label="Menu principal">
          <p className="ph-nav-label">Officine</p>
          {links.map(link => <Link key={link.href} href={link.href} className={`ph-nav-link ${pathname === link.href ? "is-active" : ""}`} aria-current={pathname === link.href ? "page" : undefined}>
            <Icon name={link.icon} size={18}/><span>{link.label}</span>
            {link.href === "/inventory" && lowStock.length > 0 && <span className="ph-nav-count" aria-label={`${lowStock.length} produits sous le seuil`}>{lowStock.length}</span>}
          </Link>)}
        </nav>

        <div className="ph-sidebar-foot">
          <Link href="/settings" className={`ph-nav-link ${pathname === "/settings" ? "is-active" : ""}`}><Icon name="settings" size={18}/><span>Paramètres</span></Link>
          <a className="ph-nav-link" href="mailto:support@pharmaos.fr"><Icon name="arrow" size={18}/><span>Assistance</span></a>
          <div className="ph-profile">
            <span className="ph-avatar ph-avatar-round">{profile ? initials(fullName) : "…"}</span>
            <span className="ph-profile-copy"><b>{fullName}</b><small>{profileError || (profile ? ROLE_LABELS[profile.role] ?? profile.role : "Chargement…")}</small></span>
          </div>
          <button className="ph-nav-link ph-nav-button" type="button" onClick={logout} disabled={loggingOut}><Icon name="logout" size={18}/><span>{loggingOut ? "Déconnexion…" : "Se déconnecter"}</span></button>
        </div>
      </aside>
      {mobileOpen && <button className="ph-mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)}/>}

      <div className="ph-main">
        <header className="ph-topbar">
          <button className="ph-icon-btn ph-menu-btn" type="button" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="ph-sidebar"><Icon name="menu" size={18}/></button>
          <div className="ph-crumbs"><span>{pharmacy?.name ?? "PharmaOS"}</span><Icon name="chevron" size={14} style={{ transform: "rotate(-90deg)" }}/><strong>{current?.label ?? "Espace de travail"}</strong></div>
          <div className="ph-top-actions">
            <div className="ph-search" ref={searchWrapRef}>
              <label className="ph-search-field" onClick={() => setSearchOpen(true)}>
                <Icon name="search" size={16}/>
                <input ref={searchRef} placeholder="Aller à une page" value={search} onFocus={() => setSearchOpen(true)} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && results[0]) { router.push(results[0].href); setSearch(""); setSearchOpen(false); } }} aria-label="Aller à une page"/>
                <kbd className="ph-kbd">Ctrl K</kbd>
              </label>
              {searchOpen && <div className="ph-popover" role="listbox" aria-label="Pages">{results.length ? results.map(item => <Link className="ph-popover-item" href={item.href} key={item.href} onClick={() => { setSearchOpen(false); setSearch(""); }}><Icon name={item.icon} size={16}/><span>{item.label}</span></Link>) : <p className="ph-popover-empty">Aucune page trouvée</p>}</div>}
            </div>
            <div className="ph-search" ref={notificationsRef}>
              <button className="ph-icon-btn" type="button" aria-label={lowStock.length ? `Alertes de stock : ${lowStock.length}` : "Alertes de stock"} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(open => !open)}><Icon name="bell" size={18}/>{lowStock.length > 0 && <span className="ph-dot" aria-hidden="true"/>}</button>
              {notificationsOpen && <section className="ph-popover" aria-label="Alertes de stock">
                <p className="ph-popover-title">{lowStock.length ? `${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} sous le seuil` : "Alertes de stock"}</p>
                {lowStock.length ? lowStock.slice(0, 6).map(level => <Link className="ph-popover-item" key={level.productId} href={`/inventory?product=${level.productId}`} onClick={() => setNotificationsOpen(false)}><span className="ph-cell-main"><b>{level.productName}</b></span><small className="ph-num">{level.quantity} / seuil {level.stockThreshold}</small></Link>) : <p className="ph-popover-empty">Tous les produits sont au-dessus de leur seuil</p>}
                {lowStock.length > 6 && <Link className="ph-popover-item" href="/inventory" onClick={() => setNotificationsOpen(false)}><span className="ph-link">Voir les {lowStock.length} alertes</span></Link>}
              </section>}
            </div>
          </div>
        </header>
        <main className="ph-content">
          {children}
          <footer className="ph-footer">PharmaOS · Gestion d’officine</footer>
        </main>
      </div>
    </div>
  </SessionContext.Provider>;
}
