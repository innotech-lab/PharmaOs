"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../../components/icons";
import { EmptyState, LoadingRows, Modal, Notice, PageHeader } from "../../../components/ui";
import { api } from "../../../lib/api";
import { initials, ROLE_LABELS } from "../../../lib/format";
import { useCurrentUser } from "../../../lib/session";

type User = { id: string; firstName: string; lastName: string; email: string; role: string; active: boolean };
const empty = { firstName: "", lastName: "", email: "", password: "", role: "CASHIER" };
const roleDescriptions: Record<string, string> = {
  OWNER: "Gère l’officine, l’équipe et les annulations",
  MANAGER: "Gère le catalogue, le stock et peut annuler une vente",
  CASHIER: "Encaisse les ventes et consulte le stock",
};

export default function UsersPage() {
  const me = useCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const owner = me?.role === "OWNER";

  useEffect(() => {
    let active = true;
    api<User[]>("/users").then(data => { if (active) setUsers(data); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Chargement impossible"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const user = await api<User>("/users", { method: "POST", body: JSON.stringify(form) });
      setUsers(current => [...current, user]); setForm(empty); setOpen(false);
      setSuccess(`${user.firstName} ${user.lastName} a été ajouté comme ${ROLE_LABELS[user.role]?.toLowerCase() ?? user.role}. Transmettez-lui son mot de passe temporaire pour sa première connexion.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Création impossible"); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeader title="Équipe" subtitle="Les personnes qui travaillent dans l’officine et ce que chacune peut faire">
      {owner && <button className="ph-btn ph-btn-primary" onClick={() => { setError(""); setOpen(true); }}><Icon name="plus" size={16}/>Ajouter un membre</button>}
    </PageHeader>
    {error && !open && <Notice tone="error">{error}</Notice>}
    {success && <Notice tone="success">{success}</Notice>}

    <section className="ph-card ph-card-flush" aria-labelledby="team-title">
      <div className="ph-card-head"><h2 className="ph-card-title" id="team-title">Membres</h2><p className="ph-card-meta">{loading ? "Chargement…" : `${users.length} personne${users.length > 1 ? "s" : ""}`}</p></div>
      {loading ? <LoadingRows/> : users.length ? <div className="ph-table-wrap"><table className="ph-table">
        <thead><tr><th>Nom</th><th className="ph-hide-sm">Adresse e-mail</th><th>Rôle</th><th className="ph-hide-sm">Statut</th></tr></thead>
        <tbody>{users.map(user => <tr key={user.id}>
          <td><span style={{ alignItems: "center", display: "flex", gap: 12 }}><span className="ph-avatar ph-avatar-round">{initials(`${user.firstName} ${user.lastName}`)}</span><span className="ph-cell-main"><b>{user.firstName} {user.lastName}{user.id === me?.id ? " (vous)" : ""}</b><small className="ph-show-sm">{user.email}</small></span></span></td>
          <td className="ph-hide-sm">{user.email}</td>
          <td><span className="ph-cell-main"><b>{ROLE_LABELS[user.role] ?? user.role}</b><small>{roleDescriptions[user.role]}</small></span></td>
          <td className="ph-hide-sm"><span className={`ph-badge ${user.active ? "is-ok" : "is-muted"}`}>{user.active ? "Actif" : "Inactif"}</span></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState icon="users" title="Aucun membre" text="Ajoutez les personnes qui encaissent ou gèrent le stock."/>}
    </section>
    {!owner && !loading && <p className="ph-hint">Seul le titulaire de l’officine peut ajouter un membre.</p>}

    {open && <Modal title="Ajouter un membre" description="Le membre se connectera avec son adresse e-mail et le mot de passe initial que vous choisissez" onClose={() => setOpen(false)}>
      <form className="ph-form" onSubmit={create}>
        <div className="ph-form-row">
          <label className="ph-field"><span>Prénom</span><input required autoFocus autoComplete="off" value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })}/></label>
          <label className="ph-field"><span>Nom</span><input required autoComplete="off" value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })}/></label>
        </div>
        <label className="ph-field"><span>Adresse e-mail</span><input required type="email" autoComplete="off" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></label>
        <label className="ph-field"><span>Mot de passe temporaire</span><input required type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}/><span className="ph-hint">Le membre le changera à sa première connexion</span></label>
        <fieldset className="ph-field" style={{ border: 0, margin: 0, padding: 0 }}>
          <span>Rôle</span>
          {(["CASHIER", "MANAGER"] as const).map(role => <label key={role} className="ph-switch" style={{ justifyContent: "flex-start" }}>
            <input type="radio" name="role" value={role} checked={form.role === role} onChange={() => setForm({ ...form, role })}/>
            <span className="ph-cell-main"><b>{ROLE_LABELS[role]}</b><small>{roleDescriptions[role]}</small></span>
          </label>)}
        </fieldset>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="ph-form-actions"><button type="button" className="ph-btn ph-btn-secondary" onClick={() => setOpen(false)}>Annuler</button><button className="ph-btn ph-btn-primary" disabled={saving}>{saving ? "Enregistrement…" : "Ajouter le membre"}</button></div>
      </form>
    </Modal>}
  </>;
}
