"use client";

import { useEffect, useState } from "react";
import type { CreateUserInput, Role, UpdateUserInput, UserSummary } from "@pharmaos/shared";
import { usersApi } from "../../../lib/api";

type FormState = { firstName: string; lastName: string; email: string; password: string; role: Exclude<Role, "OWNER"> };
const emptyForm: FormState = { firstName: "", lastName: "", email: "", password: "", role: "CASHIER" };

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() { try { setUsers(await usersApi.list()); } catch (error) { setMessage(error instanceof Error ? error.message : "Impossible de charger l’équipe"); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  function startCreate() { setEditing(null); setForm(emptyForm); setMessage(""); setOpen(true); }
  function startEdit(user: UserSummary) { setEditing(user); setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: "", role: user.role === "OWNER" ? "CASHIER" : user.role }); setMessage(""); setOpen(true); }
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(""); try { if (editing) { const changes: UpdateUserInput = { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role }; const updated = await usersApi.update(editing.id, changes); setUsers(current => current.map(user => user.id === editing.id ? updated : user)); } else { const created = await usersApi.create(form as CreateUserInput); setUsers(current => [created, ...current]); } setOpen(false); } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible"); } }
  async function remove(user: UserSummary) { if (!window.confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) return; try { await usersApi.remove(user.id); setUsers(current => current.filter(item => item.id !== user.id)); } catch (error) { setMessage(error instanceof Error ? error.message : "Suppression impossible"); } }

  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> GESTION DE L’OFFICINE</div><h1>Votre équipe</h1><p>Invitez et gérez les personnes qui font vivre votre officine.</p></div><button className="button button-primary" onClick={startCreate}>+ Inviter un membre</button></div>
    {message && <p className="login-message" role="status">{message}</p>}
    <section className="panel directory-panel"><div className="directory-head"><div><div className="section-label">ANNUAIRE</div><h2>Membres <span className="count-badge">{users.length}</span></h2></div></div>
      {loading ? <div className="empty-state" role="status">Chargement de l’équipe…</div> : users.length ? <div className="supplier-table-wrap"><table className="supplier-table"><thead><tr><th>MEMBRE</th><th>RÔLE</th><th>EMAIL</th><th>STATUT</th><th/></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><b>{user.firstName} {user.lastName}</b></td><td><span className="category-tag">{user.role}</span></td><td>{user.email}</td><td><span className={`status-badge ${user.active ? "status-active" : "status-inactive"}`}><i/> {user.active ? "Actif" : "Inactif"}</span></td><td><div className="row-actions"><button onClick={() => startEdit(user)}>Modifier</button>{user.role !== "OWNER" && <button aria-label={`Supprimer ${user.firstName} ${user.lastName}`} onClick={() => void remove(user)}>Supprimer</button>}</div></td></tr>)}</tbody></table></div> : <div className="empty-state"><b>Aucun membre invité</b><p>Invitez un manager ou un caissier pour commencer.</p><button className="button button-primary" onClick={startCreate}>+ Inviter un membre</button></div>}
    </section>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"><button className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer">×</button><div className="section-label">GESTION DE L’ÉQUIPE</div><h2 id="user-modal-title">{editing ? "Modifier le membre" : "Inviter un membre"}</h2><p>Le compte sera rattaché à votre organisation.</p><form className="supplier-form" onSubmit={submit}><label htmlFor="user-first-name">Prénom<input id="user-first-name" required value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })}/></label><label htmlFor="user-last-name">Nom<input id="user-last-name" required value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })}/></label><label htmlFor="user-email">Adresse e-mail<input id="user-email" required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></label><label htmlFor="user-role">Rôle<select id="user-role" value={form.role} onChange={event => setForm({ ...form, role: event.target.value as FormState["role"] })}><option value="CASHIER">Caissier</option><option value="MANAGER">Manager</option></select></label>{!editing && <label htmlFor="user-password">Mot de passe initial<input id="user-password" required minLength={8} type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}/></label>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Annuler</button><button type="submit" className="button button-primary">{editing ? "Enregistrer" : "Envoyer l’invitation"}</button></div></form></section></div>}
  </>;
}
