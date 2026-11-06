import { AnimatedLogo } from "../components/animated-logo";

export default function Loading() {
  return <div className="route-skeleton" role="status" aria-label="Chargement en cours"><div className="route-loading-mark"><AnimatedLogo loading /></div><span className="skeleton sk-route-title"/><span className="skeleton sk-route-subtitle"/><div className="route-skeleton-grid">{[1,2,3].map(n => <span className="skeleton" key={n}/>)}</div><span className="skeleton sk-route-table"/></div>;
}
