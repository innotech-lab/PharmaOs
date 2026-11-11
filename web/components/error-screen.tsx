"use client";

import Link from "next/link";
import { AnimatedLogo } from "./animated-logo";

type ErrorKind = "not-found" | "timeout" | "error";

const content = {
  "not-found": { code: "404", title: "Page introuvable", description: "Cette page n’existe pas ou n’est plus disponible." },
  timeout: { code: "DÉLAI DÉPASSÉ", title: "La réponse tarde à arriver", description: "La demande a pris trop de temps. Vous pouvez réessayer." },
  error: { code: "ERREUR", title: "Une erreur est survenue", description: "Nous n’avons pas pu afficher cette page. Vous pouvez réessayer." },
};

export function ErrorScreen({ kind, retry }: { kind: ErrorKind; retry?: () => void }) {
  const item = content[kind];
  return <main className={`error-page error-${kind}`}>
    <section className="error-card" aria-labelledby="error-title">
      <div className="error-logo"><AnimatedLogo /></div>
      <span className="error-code">{item.code}</span>
      <h1 id="error-title">{item.title}</h1>
      <p>{item.description}</p>
      <div className="error-actions">{retry && <button className="error-primary" type="button" onClick={retry}>Réessayer</button>}<Link className={retry ? "error-secondary" : "error-primary"} href="/">Retour à l’accueil</Link></div>
    </section>
    <span className="error-brand">Pharma<span>OS</span></span>
  </main>;
}
