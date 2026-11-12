"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatedLogo } from "../../../components/animated-logo";
import { authApi } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try { await authApi.changePassword({ currentPassword, newPassword }); router.push("/"); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Modification impossible"); }
    finally { setSaving(false); }
  }

  return <main className="login-page">
    <section className="login-card" aria-labelledby="change-password-title">
      <Link className="login-brand" href="/" aria-label="PharmaOS — accueil"><span className="login-brand-mark"><AnimatedLogo /></span><span className="login-brand-name">Pharma<span>OS</span></span></Link>
      <div className="login-heading"><h1 id="change-password-title">Choisissez un mot de passe</h1><p>Remplacez votre mot de passe temporaire pour continuer.</p></div>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="current-password">Mot de passe temporaire</label>
        <div className="login-password-field"><input id="current-password" type={showCurrent ? "text" : "password"} autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /><button type="button" className="login-password-toggle" aria-pressed={showCurrent} onClick={() => setShowCurrent(value => !value)}>{showCurrent ? "Masquer" : "Afficher"}</button></div>
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <div className="login-password-field"><input id="new-password" type={showNew ? "text" : "password"} autoComplete="new-password" required minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="8 caractères minimum" /><button type="button" className="login-password-toggle" aria-pressed={showNew} onClick={() => setShowNew(value => !value)}>{showNew ? "Masquer" : "Afficher"}</button></div>
        <button className="login-submit" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Changer le mot de passe"}<span aria-hidden="true">→</span></button>
      </form>
      {message && <p className="login-message" role="status">{message}</p>}
    </section>
    <p className="login-footer">PharmaOS · Gestion d’officine</p>
  </main>;
}
