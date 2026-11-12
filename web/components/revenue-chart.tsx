"use client";

import type { ReportDay } from "@pharmaos/shared";
import { formatDay, formatMoney, formatNumber } from "../lib/format";

// Arrondit l'échelle à une valeur lisible (1, 2, 2,5 ou 5 × 10^n).
function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(candidate => candidate * power >= value) ?? 10;
  return step * power;
}

const compact = (value: number) => value >= 1_000_000 ? `${formatNumber(value / 1_000_000)} M` : value >= 1000 ? `${formatNumber(value / 1000)} k` : formatNumber(value);

// Chiffre d'affaires par jour : le jour en cours porte l'accent, les autres restent neutres.
export function RevenueChart({ days }: { days: ReportDay[] }) {
  const max = niceMax(Math.max(...days.map(day => day.revenueTTC), 0));
  const labelEvery = days.length > 14 ? 5 : days.length > 7 ? 2 : 1;
  const lastIndex = days.length - 1;
  return <figure className="ph-chart" style={{ margin: 0 }}>
    <div className="ph-chart-scale" aria-hidden="true">{[max, max / 2, 0].map(value => <span key={value}>{compact(value)}</span>)}</div>
    <div className="ph-chart-plot">
      <div className="ph-chart-lines" aria-hidden="true"><i/><i/><i/></div>
      <div className="ph-chart-bars">{days.map((day, index) => <button
        type="button"
        key={day.date}
        className={`ph-bar ${index === lastIndex ? "is-current" : ""}`}
        aria-label={`${formatDay(day.date, { weekday: "long", day: "numeric", month: "long" })} : ${formatMoney(day.revenueTTC)}, ${day.salesCount} vente${day.salesCount > 1 ? "s" : ""}`}
      >
        <span className="ph-bar-fill" style={{ height: `${(day.revenueTTC / max) * 100}%` }}/>
        <span className="ph-bar-tip" aria-hidden="true">{formatDay(day.date, { weekday: "short", day: "numeric", month: "short" })} · {formatMoney(day.revenueTTC)} · {day.salesCount} vente{day.salesCount > 1 ? "s" : ""}</span>
      </button>)}</div>
    </div>
    <div className="ph-chart-axis" aria-hidden="true">{days.map((day, index) => {
      const offset = lastIndex - index;
      const labelled = index === lastIndex || (offset % labelEvery === 0 && offset > 1);
      // Sur petit écran, une date sur deux seulement, pour qu'elles ne se chevauchent pas.
      const minor = index !== lastIndex && offset % (labelEvery * 2) !== 0;
      return <span key={day.date} className={labelled && minor ? "ph-axis-minor" : undefined}>{index === lastIndex ? "Aujourd’hui" : labelled ? formatDay(day.date) : ""}</span>;
    })}</div>
  </figure>;
}
