import { Icon } from "../../../components/icons";

export default function SettingsPage() {
  return <>
    <div className="page-heading"><div><div className="title-kicker"><span className="live-dot"/> ORGANISATION</div><h1>Paramètres</h1></div></div>
    <div className="settings-layout"><section className="panel settings-panel"><div className="settings-section-title"><div className="settings-section-icon"><Icon name="pin"/></div><div><h2>Pharmacies</h2></div></div><div className="settings-empty"><Icon name="supplier" size={22}/><p>Aucune pharmacie chargée</p></div></section>
    <section className="panel settings-panel details-panel"><div className="settings-section-title"><div className="settings-section-icon"><Icon name="settings"/></div><div><h2>Informations de l’officine</h2></div></div><div className="settings-empty"><Icon name="pin" size={22}/><p>Sélectionnez une pharmacie pour afficher ses informations</p></div></section></div>
  </>;
}
