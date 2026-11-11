"use client";

import { useEffect, useState } from "react";
import { api, authApi } from "../../../lib/api";

type User = { id: string; firstName: string; lastName: string; email: string; role: string; active: boolean };
const empty = { firstName: "", lastName: "", email: "", password: "", role: "CASHIER" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(empty);
  const [owner, setOwner] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api<User[]>("/users"), authApi.me()]).then(([data, me]) => { if (active) { setUsers(data); setOwner(me.role === "OWNER"); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const user = await api<User>("/users", { method: "POST", body: JSON.stringify(form) });
      setUsers(current => [...current, user]); setForm(empty); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Création impossible"); }
    finally { setSaving(false); }
  }
  return <>
    <div className="page-heading"><h1>Votre équipe</h1>{owner && <button className="button button-primary" onClick={() => setOpen(true)}>Ajouter un membre</button>}</div>
    {error && <p role="alert">{error}</p>}
    <section className="panel directory-panel"><div className="directory-head"><h2>Membres <span className="count-badge">{users.length}</span></h2></div>
      {loading ? <p role="status">Chargement de l’équipe…</p> : users.length ? <div className="supplier-table-wrap"><table className="supplier-table"><thead><tr><th>NOM</th><th>ADRESSE E-MAIL</th><th>RÔLE</th><th>STATUT</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.firstName} {user.lastName}</td><td>{user.email}</td><td>{user.role}</td><td>{user.active ? "Actif" : "Inactif"}</td></tr>)}</tbody></table></div> : <div className="empty-state">Aucun membre trouvé.</div>}
    </section>
    {open && <div className="modal-backdrop"><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="user-title"><h2 id="user-title">Ajouter un membre</h2><form className="supplier-form" onSubmit={create}>
      <label>Prénom<input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}/></label>
      <label>Nom<input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}/></label>
      <label>Adresse e-mail<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
      <label>Mot de passe initial<input required type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
      <label>Rôle<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="CASHIER">Caissier</option><option value="MANAGER">Manager</option></select></label>
      <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Annuler</button><button className="button button-primary" disabled={saving}>{saving ? "Enregistrement…" : "Ajouter"}</button></div>
    </form></section></div>}
  </>;
}
