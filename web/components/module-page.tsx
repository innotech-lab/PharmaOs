"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icons";

type Supplier = { name: string; email: string; phone: string; category: string; active: boolean };
const config: Record<string, { title: string; description: string; icon: "box" | "stock" | "cart" | "supplier" | "chart" | "users"; action?: string }> = {
  products: { title: "Catalogue produits", description: "Retrouvez et gérez les produits de votre officine.", icon: "box" },
  inventory: { title: "Inventaire", description: "Suivez les niveaux de stock et anticipez les réapprovisionnements.", icon: "stock" },
  pos: { title: "Point de vente", description: "Retrouvez votre activité de caisse en un coup d’œil.", icon: "cart" },
  suppliers: { title: "Vos partenaires", description: "Gardez vos partenaires d’approvisionnement à portée de main.", icon: "supplier", action: "Ajouter un fournisseur" },
  reports: { title: "Rapports", description: "Les indicateurs clés de votre activité, réunis au même endroit.", icon: "chart" },
  users: { title: "Votre équipe", description: "Les personnes qui font vivre votre officine au quotidien.", icon: "users" },
};

export function ModulePage({ module }: { module: keyof typeof config }) {
  const info = config[module];
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Supplier>({ name: "", email: "", phone: "", category: "Grossiste répartiteur", active: true });
  const filtered = useMemo(() => suppliers.filter(s => `${s.name} ${s.email} ${s.category}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || (filter === "active" ? s.active : s.category === filter))), [suppliers, query, filter]);
  function saveSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = [...suppliers];
    if (editing === null) next.unshift(form); else next[editing] = form;
    setSuppliers(next); setModal(false); setEditing(null);
    setForm({ name: "", email: "", phone: "", category: "Grossiste répartiteur", active: true });
  }
  function editSupplier(index: number) { setForm({ ...suppliers[index] }); setEditing(index); setModal(true); }
  function deleteSupplier(index: number) {
    const next = suppliers.filter((_, i) => i !== index); setSuppliers(next);
  }
  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> GESTION DE L’OFFICINE</div><h1>{module === "suppliers" ? "Vos partenaires" : info.title}</h1><p>{module === "suppliers" ? "Gardez vos partenaires d’approvisionnement à portée de main." : info.description}</p></div>{info.action && <button className="button button-primary" onClick={() => { if (module === "suppliers") { setEditing(null); setForm({ name: "", email: "", phone: "", category: "Grossiste répartiteur", active: true }); setModal(true); } else setModal(true); }}><Icon name="plus" size={17}/>{info.action}</button>}</div>
    {module === "suppliers" ? <><div className="supplier-stats"><div className="supplier-stat"><span className="kpi-icon teal"><Icon name="supplier" size={19}/></span><div><small>PARTENAIRES AU TOTAL</small><b>—</b></div></div><div className="supplier-stat"><span className="kpi-icon blue"><Icon name="check" size={19}/></span><div><small>PARTENAIRES ACTIFS</small><b>—</b></div></div><div className="supplier-stat supplier-stat-note"/></div>
      <section className="panel directory-panel"><div className="directory-head"><div><div className="section-label">ANNUAIRE</div><h2>Fournisseurs <span className="count-badge">{filtered.length}</span></h2></div><div className="directory-tools"><label className="table-search"><Icon name="search" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un fournisseur…"/></label><select className="button button-secondary filter-button" aria-label="Filtrer les fournisseurs" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tous</option><option value="active">Actifs</option><option>Grossiste répartiteur</option><option>Laboratoire</option><option>Matériel médical</option></select></div></div>{filtered.length ? <div className="supplier-table-wrap"><table className="supplier-table"><thead><tr><th>FOURNISSEUR</th><th>CATÉGORIE</th><th>CONTACT</th><th>STATUT</th><th/></tr></thead><tbody>{filtered.map((supplier) => { const originalIndex = suppliers.indexOf(supplier); return <tr key={supplier.email}><td><div className="supplier-identity"><div className={`supplier-logo logo-${originalIndex % 5}`}>{supplier.name.split(/\s/).slice(0, 2).map(w => w[0]).join("")}</div><span><b>{supplier.name}</b></span></div></td><td><span className="category-tag">{supplier.category}</span></td><td><span>{supplier.email}</span><small className="contact-phone">{supplier.phone}</small></td><td><span className={`status-badge ${supplier.active ? "status-active" : "status-inactive"}`}><i/> {supplier.active ? "Actif" : "Inactif"}</span></td><td><div className="row-actions"><button aria-label={`Modifier ${supplier.name}`} onClick={() => editSupplier(originalIndex)}>Modifier</button><button aria-label={`Supprimer ${supplier.name}`} onClick={() => deleteSupplier(originalIndex)}><Icon name="close" size={16}/></button></div></td></tr>; })}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Icon name="supplier" size={23}/></span><b>Aucun fournisseur</b><button className="button button-primary" onClick={() => setModal(true)}><Icon name="plus" size={17}/> Ajouter un fournisseur</button></div>}<div className="directory-footer"><span>{filtered.length} fournisseur{filtered.length > 1 ? "s" : ""}</span></div></section>
      <div className="supplier-tip"><span>✦</span><div><b>Un annuaire bien tenu, c’est du temps gagné.</b><p>Ajoutez vos partenaires habituels pour retrouver rapidement leurs coordonnées au moment de passer commande.</p></div></div>
      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title"><button className="modal-close" onClick={() => setModal(false)} aria-label="Fermer"><Icon name="close"/></button><div className="modal-icon"><Icon name="supplier"/></div><div className="section-label">ANNUAIRE FOURNISSEURS</div><h2 id="supplier-modal-title">{editing === null ? "Ajouter un partenaire" : "Modifier le partenaire"}</h2><form onSubmit={saveSupplier} className="supplier-form"><label>Nom du fournisseur<input required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du fournisseur"/></label><label>Adresse e-mail<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Adresse e-mail"/></label><label>Téléphone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone"/></label><label>Catégorie<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Grossiste répartiteur</option><option>Laboratoire</option><option>Matériel médical</option><option>Autre</option></select></label><label className="toggle-label"><span><b>Partenaire actif</b></span><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(false)}>Annuler</button><button className="button button-primary" type="submit">{editing === null ? "Ajouter le fournisseur" : "Enregistrer"}</button></div></form></section></div>}
    </> : <section className="panel module-placeholder"><div className="module-empty"><div className="module-placeholder-icon"><Icon name={info.icon} size={25}/></div><h2>{module === "pos" ? "Aucune vente en cours" : module === "inventory" ? "Aucun mouvement de stock" : module === "products" ? "Aucun produit" : module === "reports" ? "Aucun rapport" : "Aucun membre"}</h2></div></section>}
  </>;
}

