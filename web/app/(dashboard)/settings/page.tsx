"use client";

import { LoadingRows, PageHeader } from "../../../components/ui";
import { CURRENCY, ROLE_LABELS } from "../../../lib/format";
import { useCurrentUser } from "../../../lib/session";

export default function SettingsPage() {
  const user = useCurrentUser();
  const pharmacy = user?.pharmacy;
  return <>
    <PageHeader title="Paramètres" subtitle="L’officine active et votre compte"/>
    <div className="ph-grid-half">
      <section className="ph-card" aria-labelledby="pharmacy-title">
        <div className="ph-card-head"><h2 className="ph-card-title" id="pharmacy-title">Officine</h2></div>
        {!user ? <LoadingRows rows={3}/> : pharmacy ? <dl className="ph-totals">
          <div><dt>Nom</dt><dd>{pharmacy.name}</dd></div>
          <div><dt>Ville</dt><dd>{pharmacy.city || "Non renseignée"}</dd></div>
          <div><dt>Pays</dt><dd>{pharmacy.country || "Non renseigné"}</dd></div>
          <div><dt>Devise</dt><dd>Franc burundais ({CURRENCY})</dd></div>
        </dl> : <p className="ph-hint">Aucune pharmacie liée à ce compte</p>}
      </section>
      <section className="ph-card" aria-labelledby="account-title">
        <div className="ph-card-head"><h2 className="ph-card-title" id="account-title">Votre compte</h2></div>
        {!user ? <LoadingRows rows={3}/> : <dl className="ph-totals">
          <div><dt>Nom</dt><dd>{user.firstName} {user.lastName}</dd></div>
          <div><dt>Adresse e-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Rôle</dt><dd>{ROLE_LABELS[user.role] ?? user.role}</dd></div>
        </dl>}
      </section>
    </div>
  </>;
}
