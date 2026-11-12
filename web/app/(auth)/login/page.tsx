"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatedLogo } from "../../../components/animated-logo";
import { authApi } from "../../../lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnimationKey(key => key + 1);
    try { await authApi.login({ email, password }); router.push("/"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Connexion impossible"); }
  }

  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <Link className="login-brand" href="/" aria-label="PharmaOS — accueil">
        <span className="login-brand-mark" key={animationKey}><AnimatedLogo /></span>
        <span className="login-brand-name">Pharma<span>OS</span></span>
      </Link>
      <div className="login-heading"><span className="login-eyebrow">ESPACE OFFICINE</span><h1 id="login-title">Connexion</h1><p>Accédez à votre espace PharmaOS.</p></div>
      <form onSubmit={submit} className="login-form">
        <label htmlFor="login-email">Adresse e-mail</label>
        <input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@pharmacie.fr" />
        <label htmlFor="login-password">Mot de passe</label>
        <div className="login-password-field"><input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" /><button type="button" className="login-password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Masquer" : "Afficher"}</button></div>
        <button className="login-submit" type="submit">Se connecter <span aria-hidden="true">→</span></button>
      </form>
      {message && <p className="login-message" role="status">{message}</p>}
      <div className="login-bottom">Vous découvrez PharmaOS ? <Link href="/register">Créer un compte</Link></div>
    </section>
    <p className="login-footer">PharmaOS · Gestion d’officine</p>
  </main>;
}
