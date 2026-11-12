"use client";

import { useEffect, useMemo, useState } from "react";
import type { Supplier, SupplierCategory } from "@pharmaos/shared";
import { Icon } from "./icons";
import { EmptyState, LoadingRows, Modal, Notice, PageHeader } from "./ui";
import { api } from "../lib/api";
import { formatNumber, initials } from "../lib/format";

const categories: SupplierCategory[] = ["Grossiste répartiteur", "Laboratoire", "Matériel médical", "Autre"];
type SupplierForm = { name: string; email: string; phone: string; category: SupplierCategory; active: boolean };
const blankSupplier: SupplierForm = { name: "", email: "", phone: "", category: "Grossiste répartiteur", active: true };
const toForm = (supplier: Supplier): SupplierForm => ({ name: supplier.name, email: supplier.email, phone: supplier.phone ?? "", category: supplier.category, active: supplier.active });
const byName = (a: Supplier, b: Supplier) => a.name.localeCompare(b.name);

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(blankSupplier);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const activeCount = useMemo(() => suppliers.filter(supplier => supplier.active).length, [suppliers]);
  const filtered = useMemo(() => suppliers.filter(supplier =>
    `${supplier.name} ${supplier.email} ${supplier.category}`.toLowerCase().includes(query.trim().toLowerCase())
    && (filter === "all" || (filter === "active" ? supplier.active : supplier.category === filter))), [suppliers, query, filter]);

  useEffect(() => {
    let active = true;
    api<Supplier[]>("/suppliers")
      .then(items => { if (active) setSuppliers(items); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Chargement impossible"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function openCreate() { setEditing(null); setForm(blankSupplier); setError(""); setModalOpen(true); }
  function openEdit(supplier: Supplier) { setEditing(supplier); setForm(toForm(supplier)); setError(""); setModalOpen(true); }

  async function saveSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const saved = await api<Supplier>(editing ? `/suppliers/${editing.id}` : "/suppliers", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...form, phone: form.phone.trim() || null }) });
      setSuppliers(current => (editing ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]).sort(byName));
      setSuccess(editing ? `« ${saved.name} » a été mis à jour` : `« ${saved.name} » a été ajouté à l’annuaire`);
      setModalOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  }

  async function removeSupplier(supplier: Supplier) {
    if (!window.confirm(`Supprimer « ${supplier.name} » de l’annuaire ? Cette action est définitive.`)) return;
    setError(""); setSuccess("");
    try {
      await api(`/suppliers/${supplier.id}`, { method: "DELETE" });
      setSuppliers(current => current.filter(item => item.id !== supplier.id));
      setSuccess(`« ${supplier.name} » a été supprimé`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Suppression impossible"); }
  }

  return <>
    <PageHeader title="Fournisseurs" subtitle="Les coordonnées de vos grossistes et laboratoires, à portée de main au moment de commander">
      <button className="ph-btn ph-btn-primary" onClick={openCreate}><Icon name="plus" size={16}/>Ajouter un fournisseur</button>
    </PageHeader>
    {error && !modalOpen && <Notice tone="error">{error}</Notice>}
    {success && <Notice tone="success">{success}</Notice>}

    <section className="ph-stats" aria-label="Annuaire">
      <article className="ph-stat"><p className="ph-stat-label">Fournisseurs</p><p className="ph-stat-value">{loading ? "—" : formatNumber(suppliers.length)}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Actifs</p><p className="ph-stat-value">{loading ? "—" : formatNumber(activeCount)}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Grossistes répartiteurs</p><p className="ph-stat-value">{loading ? "—" : formatNumber(suppliers.filter(supplier => supplier.category === "Grossiste répartiteur").length)}</p></article>
      <article className="ph-stat"><p className="ph-stat-label">Laboratoires</p><p className="ph-stat-value">{loading ? "—" : formatNumber(suppliers.filter(supplier => supplier.category === "Laboratoire").length)}</p></article>
    </section>

    <section className="ph-card ph-card-flush" aria-labelledby="suppliers-title">
      <div className="ph-card-head">
        <h2 className="ph-card-title" id="suppliers-title">Annuaire</h2>
        <div className="ph-toolbar">
          <select className="ph-select" aria-label="Filtrer les fournisseurs" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Tous</option><option value="active">Actifs</option>{categories.map(category => <option key={category}>{category}</option>)}</select>
          <label className="ph-input-search"><Icon name="search" size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom, e-mail, catégorie" aria-label="Rechercher un fournisseur"/></label>
        </div>
      </div>
      {loading ? <LoadingRows/> : filtered.length ? <div className="ph-table-wrap"><table className="ph-table">
        <thead><tr><th>Fournisseur</th><th className="ph-hide-sm">Catégorie</th><th>Contact</th><th className="ph-hide-sm">Statut</th><th><span className="ph-sr">Actions</span></th></tr></thead>
        <tbody>{filtered.map(supplier => <tr key={supplier.id}>
          <td><span style={{ alignItems: "center", display: "flex", gap: 12 }}><span className="ph-avatar">{initials(supplier.name)}</span><span className="ph-cell-main"><b>{supplier.name}</b></span></span></td>
          <td className="ph-hide-sm"><span className="ph-tag">{supplier.category}</span></td>
          <td><span className="ph-cell-main"><a className="ph-link" href={`mailto:${supplier.email}`}>{supplier.email}</a>{supplier.phone && <small><a href={`tel:${supplier.phone.replace(/\s/g, "")}`}>{supplier.phone}</a></small>}</span></td>
          <td className="ph-hide-sm"><span className={`ph-badge ${supplier.active ? "is-ok" : "is-muted"}`}>{supplier.active ? "Actif" : "Inactif"}</span></td>
          <td><div className="ph-row-actions">
            <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => openEdit(supplier)} aria-label={`Modifier ${supplier.name}`}>Modifier</button>
            <button type="button" className="ph-btn ph-btn-ghost ph-btn-sm" onClick={() => removeSupplier(supplier)} aria-label={`Supprimer ${supplier.name}`}><Icon name="trash" size={16}/></button>
          </div></td>
        </tr>)}</tbody>
      </table></div> : suppliers.length ? <EmptyState icon="search" title="Aucun fournisseur trouvé" text="Modifiez la recherche ou le filtre."/> : <EmptyState icon="supplier" title="Votre annuaire est vide" text="Ajoutez vos partenaires habituels pour retrouver leurs coordonnées au moment de commander."><button className="ph-btn ph-btn-primary" onClick={openCreate}><Icon name="plus" size={16}/>Ajouter un fournisseur</button></EmptyState>}
      {!loading && filtered.length > 0 && <p className="ph-table-foot">{filtered.length} fournisseur{filtered.length > 1 ? "s" : ""}</p>}
    </section>

    {modalOpen && <Modal title={editing ? "Modifier le fournisseur" : "Ajouter un fournisseur"} onClose={() => setModalOpen(false)}>
      <form onSubmit={saveSupplier} className="ph-form">
        <label className="ph-field"><span>Nom du fournisseur</span><input required autoFocus maxLength={160} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Grossiste ou laboratoire"/></label>
        <label className="ph-field"><span>Adresse e-mail</span><input required type="email" maxLength={254} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="commandes@fournisseur.bi"/></label>
        <div className="ph-form-row">
          <label className="ph-field"><span>Téléphone (facultatif)</span><input type="tel" maxLength={40} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="+257"/></label>
          <label className="ph-field"><span>Catégorie</span><select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as SupplierCategory })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        </div>
        <label className="ph-switch"><span>Fournisseur actif</span><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/></label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="ph-form-actions"><button type="button" className="ph-btn ph-btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button><button disabled={saving} className="ph-btn ph-btn-primary" type="submit">{saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Ajouter à l’annuaire"}</button></div>
      </form>
    </Modal>}
  </>;
}
