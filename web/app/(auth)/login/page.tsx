"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatedLogo } from "../../../components/animated-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnimationKey(key => key + 1);
    setMessage("La connexion sera disponible dès que l’API d’authentification sera activée.");
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
        <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" />
        <button className="login-submit" type="submit">Se connecter <span aria-hidden="true">→</span></button>
      </form>
      {message && <p className="login-message" role="status">{message}</p>}
      <div className="login-bottom">Vous découvrez PharmaOS ? <Link href="/register">Créer un compte</Link></div>
    </section>
    <p className="login-footer">PharmaOS · Gestion d’officine</p>
  </main>;
}
