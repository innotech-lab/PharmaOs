// Formats communs à tout l'espace de travail : un seul format de montant et de date.
const moneyFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const integerFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export const CURRENCY = "FBu";

export function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${moneyFormat.format(Number.isFinite(amount) ? amount : 0)} ${CURRENCY}`;
}

export function formatNumber(value: number) {
  return integerFormat.format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatLongDate(value: Date = new Date()) {
  const text = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Date « AAAA-MM-JJ » renvoyée par l'API, affichée sans décalage de fuseau.
export function formatDay(isoDate: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function browserTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
}

// Variation lisible : « +12 % vs hier », « 3 de moins vs hier ».
export function compare(current: number, previous: number) {
  if (!previous) return { tone: "flat" as const, text: "" };
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return { tone: "flat" as const, text: "stable" };
  return { tone: change > 0 ? ("up" as const) : ("down" as const), text: `${change > 0 ? "+" : "−"}${Math.abs(change)} %` };
}

export const ROLE_LABELS: Record<string, string> = { OWNER: "Titulaire", MANAGER: "Manager", CASHIER: "Caissier" };
export const MOVEMENT_LABELS: Record<string, string> = { IN: "Entrée", OUT: "Sortie", ADJUST: "Ajustement" };
export const PAYMENT_LABELS: Record<string, string> = { CASH: "Espèces", CARD: "Carte" };

export function initials(text: string) {
  return text.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase() ?? "").join("");
}
