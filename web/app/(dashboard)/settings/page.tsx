"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../../components/icons";
import { authApi, type CurrentUser } from "../../../lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    authApi.me().then(value => { if (active) setUser(value); }).catch(() => { if (active) setError("Impossible de charger les informations de l’officine."); });
    return () => { active = false; };
  }, []);
  const pharmacy = user?.pharmacy;
  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> ORGANISATION</div><h1>Paramètres</h1></div></div>
    {error && <p role="alert">{error}</p>}
    <div className="settings-layout"><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-section-icon"><Icon name="pin"/></div><div><h2>Pharmacies</h2></div></div><div className="settings-empty"><Icon name="supplier" size={22}/><p>{pharmacy ? pharmacy.name : user ? "Aucune pharmacie liée à ce compte" : "Chargement…"}</p></div></section>
    <section className="panel settings-panel details-panel"><div className="settings-section-title"><div className="settings-section-icon"><Icon name="settings"/></div><div><h2>Informations de l’officine</h2></div></div><div className="settings-empty"><Icon name="pin" size={22}/>{pharmacy ? <><b>{pharmacy.name}</b><p>{[pharmacy.city, pharmacy.country].filter(Boolean).join(", ") || "Adresse non renseignée"}</p></> : <p>{user ? "Aucune pharmacie liée à ce compte" : "Chargement…"}</p>}</div></section></div>
  </>;
}
