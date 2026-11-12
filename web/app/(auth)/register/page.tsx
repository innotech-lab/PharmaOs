"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedLogo } from "../../../components/animated-logo";
import { authApi } from "../../../lib/api";
import { useRouter } from "next/navigation";

const steps = [
  { title: "Faisons connaissance", description: "Vous serez administrateur de votre officine." },
  { title: "Votre pharmacie", description: "Comment s’appelle votre officine ?" },
  { title: "Votre localisation", description: "Où se trouve votre officine ?" },
  { title: "Vos accès", description: "Ces identifiants serviront à vous connecter." },
];
const countries = ["Burundi", "Rwanda", "République démocratique du Congo", "Tanzanie", "Ouganda", "Kenya", "Cameroun", "Côte d’Ivoire", "Sénégal", "Bénin", "Togo", "Mali", "Burkina Faso", "Niger", "Madagascar", "Gabon", "Congo", "Guinée", "France", "Belgique", "Suisse", "Canada"];
const localeCountries: Record<string, string> = { BI: "Burundi", RW: "Rwanda", CD: "République démocratique du Congo", TZ: "Tanzanie", UG: "Ouganda", KE: "Kenya", CM: "Cameroun", CI: "Côte d’Ivoire", SN: "Sénégal", BJ: "Bénin", TG: "Togo", ML: "Mali", BF: "Burkina Faso", NE: "Niger", MG: "Madagascar", GA: "Gabon", CG: "Congo", GN: "Guinée", FR: "France", BE: "Belgique", CH: "Suisse", CA: "Canada" };

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({ firstName: "", lastName: "", pharmacy: "", country: "Burundi", city: "", email: "", password: "" });
  const [otherCountry, setOtherCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { const region = navigator.language.match(/-(\w{2})$/)?.[1]?.toUpperCase(); if (region && localeCountries[region]) setDetails(current => ({ ...current, country: localeCountries[region] })); }, []);
  const update = (field: keyof typeof details) => (event: React.ChangeEvent<HTMLInputElement>) => setDetails(current => ({ ...current, [field]: event.target.value }));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (transitioning) return;
    if (step < steps.length - 1) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStep(current => current + 1); return; }
      setTransitioning(true);
      setAnimationKey(key => key + 1);
      timer.current = setTimeout(() => { setStep(current => current + 1); setTransitioning(false); timer.current = null; }, 200);
      return;
    }
    setAnimationKey(key => key + 1);
    authApi.register({ ...details, country: details.country === "Autre pays" ? otherCountry.trim() : details.country }).then(() => { router.push("/"); router.refresh(); }).catch(error => setMessage(error instanceof Error ? error.message : "Création impossible"));
  }

  return <main className="login-page">
    <section className="login-card register-card" aria-labelledby="register-title">
      <div inert={transitioning}>
      <Link className="login-brand" href="/" aria-label="PharmaOS — accueil"><span className="login-brand-mark" key={animationKey}><AnimatedLogo /></span><span className="login-brand-name">Pharma<span>OS</span></span></Link>
      <div className="register-progress" aria-label={`Étape ${step + 1} sur ${steps.length}`}><span>ÉTAPE {step + 1} SUR {steps.length}</span><div className="register-progress-track" aria-hidden="true">{steps.map((_, index) => <i key={index} className={index <= step ? "is-active" : ""}/>)}</div></div>
      <div className="login-heading register-heading" aria-live="polite"><h1 id="register-title">{steps[step].title}</h1><p>{steps[step].description}</p></div>
      <form onSubmit={submit} className="login-form" aria-busy={transitioning}>
        {step === 0 && <><label htmlFor="register-first-name">Prénom</label><input id="register-first-name" name="firstName" autoComplete="given-name" required value={details.firstName} onChange={update("firstName")} placeholder="Votre prénom" /><label htmlFor="register-last-name">Nom</label><input id="register-last-name" name="lastName" autoComplete="family-name" required value={details.lastName} onChange={update("lastName")} placeholder="Votre nom" /></>}
        {step === 1 && <><label htmlFor="register-pharmacy">Nom de votre pharmacie</label><input id="register-pharmacy" name="pharmacy" autoComplete="organization" required value={details.pharmacy} onChange={update("pharmacy")} placeholder="Nom de votre pharmacie" /></>}
        {step === 2 && <><label htmlFor="register-country">Pays</label><select id="register-country" name="country" autoComplete="country-name" required value={details.country} onChange={event => setDetails(current => ({ ...current, country: event.target.value }))}>{countries.map(country => <option key={country}>{country}</option>)}<option>Autre pays</option></select>{details.country === "Autre pays" && <><label htmlFor="register-other-country">Nom du pays</label><input id="register-other-country" required value={otherCountry} onChange={event => setOtherCountry(event.target.value)} placeholder="Pays de l’officine" /></>}<label htmlFor="register-city">Ville</label><input id="register-city" name="city" autoComplete="address-level2" required value={details.city} onChange={update("city")} placeholder="Ville de l’officine" /></>}
        {step === 3 && <><label htmlFor="register-email">Adresse e-mail</label><input id="register-email" name="email" type="email" autoComplete="email" required value={details.email} onChange={update("email")} placeholder="vous@pharmacie.fr" /><label htmlFor="register-password">Mot de passe</label><div className="login-password-field"><input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={details.password} onChange={update("password")} placeholder="8 caractères minimum" /><button type="button" className="login-password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Masquer" : "Afficher"}</button></div></>}
        <div className="register-actions">{step > 0 && <button className="register-back" type="button" disabled={transitioning} onClick={() => { setMessage(""); setStep(current => current - 1); }}>Retour</button>}<button className="login-submit" type="submit" disabled={transitioning}>{step === steps.length - 1 ? "Créer mon espace" : "Continuer"}<span aria-hidden="true">→</span></button></div>
      </form>
      {message && <p className="login-message" role="status">{message}</p>}
      <div className="login-bottom">Vous avez déjà un compte ? <Link href="/login">Se connecter</Link></div>
      </div>
      {transitioning && <div className="register-transition" role="status" aria-label="Passage à l’étape suivante"><span className="register-transition-logo"><AnimatedLogo /></span></div>}
    </section>
    <p className="login-footer">PharmaOS · Gestion d’officine</p>
  </main>;
}
