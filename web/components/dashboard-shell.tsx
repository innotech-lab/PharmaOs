"use client";

import Link from "next/link";
import { AnimatedLogo } from "./animated-logo";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { authApi } from "../lib/api";

const links = [
  { label: "Vue d’ensemble", href: "/", icon: "dashboard" as const },
  { label: "Produits", href: "/products", icon: "box" as const },
  { label: "Inventaire", href: "/inventory", icon: "stock" as const },
  { label: "Point de vente", href: "/pos", icon: "cart" as const },
  { label: "Fournisseurs", href: "/suppliers", icon: "supplier" as const },
  { label: "Rapports", href: "/reports", icon: "chart" as const },
  { label: "Équipe", href: "/users", icon: "users" as const },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pharmacy, setPharmacy] = useState("");
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);
  const [pharmacyMenuOpen, setPharmacyMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unread = false;
  const [date, setDate] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pharmacyRef = useRef<HTMLDivElement>(null);
  const pharmacies: string[] = [];
  const results = useMemo(() => links.filter(item => item.label.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  const profileInitials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "…";
  const profileName = profile ? `${profile.firstName} ${profile.lastName}` : "Chargement du profil…";

  useEffect(() => {
    void authApi.me().then(user => { setProfile(user); setPharmacy(user.pharmacy?.name ?? ""); }).catch(() => setProfile(null));
    setDate(new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()));
    const cleanupMarker = "pharmaos:demo-data-removed-v1";
    if (!localStorage.getItem(cleanupMarker)) {
      ["pharmaos:suppliers", "pharmaos:pharmacies", "pharmaos:active-pharmacy"].forEach(key => localStorage.removeItem(key));
      localStorage.setItem(cleanupMarker, "1");
    }
    const syncPharmacy = (event: Event) => setPharmacy((event as CustomEvent<string>).detail);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); searchRef.current?.focus(); }
      if (event.key === "Escape") { setSearchOpen(false); setNotificationsOpen(false); setMobileOpen(false); setPharmacyMenuOpen(false); }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!searchWrapRef.current?.contains(target)) setSearchOpen(false);
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!pharmacyRef.current?.contains(target)) setPharmacyMenuOpen(false);
    };
    window.addEventListener("pharmaos:pharmacy-change", syncPharmacy);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { window.removeEventListener("pharmaos:pharmacy-change", syncPharmacy); window.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, []);

  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  function changePharmacy(name: string) {
    setPharmacy(name);
    setPharmacyMenuOpen(false);
    window.dispatchEvent(new CustomEvent("pharmaos:pharmacy-change", { detail: name }));
  }

  async function logout() {
    try { await authApi.logout(); } finally { ["pharmaos:access-token", "pharmaos:refresh-token"].forEach(key => localStorage.removeItem(key)); window.location.assign("/login"); }
  }

  return <div className="app-shell">
    <aside id="dashboard-sidebar" className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <Link className="brand" href="/" aria-label="PharmaOS — accueil" onClick={() => setMobileOpen(false)}><span className="brand-symbol"><AnimatedLogo /></span><span className="brand-name">Pharma<span>OS</span></span></Link>
      <div className="workspace-label">OFFICINE ACTIVE</div>
      <div className="pharmacy-menu-wrap" ref={pharmacyRef}><button className={`pharmacy-select ${pharmacyMenuOpen ? "pharmacy-select-open" : ""}`} type="button" aria-label="Choisir une pharmacie" aria-expanded={pharmacyMenuOpen} aria-haspopup="listbox" aria-controls="pharmacy-options" onClick={() => setPharmacyMenuOpen(open => !open)}><span className="pharmacy-avatar">{pharmacy ? pharmacy.split(" ").map(part => part[0]).slice(0, 2).join("") : "—"}</span><span className="pharmacy-name"><b>{pharmacy || "Aucune pharmacie"}</b><small>{pharmacy ? "Pharmacie active" : "Aucune officine liée"}</small></span><Icon name="chevron" className="select-chevron" size={16}/></button>{pharmacyMenuOpen && <div className="pharmacy-options" id="pharmacy-options" role="listbox" aria-label="Pharmacies disponibles">{pharmacies.length ? pharmacies.map(name => <button type="button" role="option" aria-selected={pharmacy === name} className={`pharmacy-option ${pharmacy === name ? "pharmacy-option-active" : ""}`} key={name} onClick={() => changePharmacy(name)}><span className="pharmacy-option-avatar">{name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><span className="pharmacy-option-copy"><b>{name}</b><small>{name === pharmacy ? "Pharmacie active" : "Changer pour cette pharmacie"}</small></span>{pharmacy === name && <Icon name="check" size={17}/>}</button>) : <p className="pharmacy-options-empty">Aucune pharmacie disponible</p>}</div>}</div>
      <div className="nav-caption">MENU</div>
      <nav className="nav-list">{links.map(link => <Link onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === link.href ? "active" : ""}`} href={link.href} key={link.href}><Icon name={link.icon}/><span>{link.label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><div className="nav-caption">PRÉFÉRENCES</div><Link onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/settings" ? "active" : ""}`} href="/settings"><Icon name="settings"/><span>Paramètres</span></Link><a className="help-link" href="mailto:support@pharmaos.fr">Assistance <Icon name="arrow" size={14}/></a><div className="profile"><div className="avatar">{profile ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}` : "…"}</div><span><b>{profile ? `${profile.firstName} ${profile.lastName}` : "Chargement du profil…"}</b><small>{profile ? `${profile.email} · ${profile.role}` : "Profil"}</small></span></div><button className="logout-link" type="button" onClick={logout}><Icon name="logout" size={16}/><span>Se déconnecter</span></button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
    <main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="dashboard-sidebar"><Icon name="menu"/></button><div className="breadcrumb"><span>PharmaOS</span><b>/</b><strong>{links.find(l => l.href === pathname)?.label || (pathname === "/settings" ? "Paramètres" : "Espace de travail")}</strong></div><div className="top-actions"><div ref={searchWrapRef} className={`search-box ${searchOpen ? "search-active" : ""}`} onClick={() => { if (!searchOpen) setSearchOpen(true); }}><Icon name="search" size={18}/><input ref={searchRef} placeholder="Rechercher dans le menu" value={search} onFocus={() => setSearchOpen(true)} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && results[0]) window.location.href = results[0].href; }} aria-label="Rechercher une page"/><kbd>Ctrl K</kbd>{searchOpen && <div className="search-popover">{search.trim() ? results.length ? results.map(item => <Link href={item.href} key={item.href} onClick={() => { setSearchOpen(false); setSearch(""); }}><Icon name={item.icon} size={17}/><span>{item.label}</span><Icon name="arrow" size={14}/></Link>) : <p>Aucune page trouvée</p> : <p>Rechercher une page du menu</p>}</div>}</div><div className="notification-wrap" ref={notificationsRef}><button className={`icon-button notification-button ${notificationsOpen ? "notification-active" : ""}`} aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Icon name="bell"/></button>{notificationsOpen && <section className="notification-popover" aria-label="Notifications"><div className="notification-head"><b>Notifications</b></div><p className="notification-empty">Aucune notification</p></section>}</div><div className="top-divider"/><div className="avatar avatar-small" title={profileName} aria-label={`Compte de ${profileName}`}>{profileInitials}</div></div></header><div className="page-content"><div className="page-eyebrow">{date}</div>{children}<footer>PharmaOS <span>•</span> Gestion d’officine</footer></div></main>
  </div>;
}
