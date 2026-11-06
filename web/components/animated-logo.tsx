import { useId } from "react";

export function AnimatedLogo({ loading = false }: { loading?: boolean }) {
  const id = useId();
  const green = `green-${id}`;
  const fade = `fade-${id}`;

  return <svg className={`animated-logo ${loading ? "animated-logo-loading" : ""}`} viewBox="195 130 377 373" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={green} x1="210" y1="300" x2="556" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#149994"/><stop offset=".55" stopColor="#159E94"/><stop offset="1" stopColor="#24B97D"/></linearGradient>
      <linearGradient id={fade} x1="500" y1="210" x2="531" y2="257" gradientUnits="userSpaceOnUse"><stop stopColor="#20B77F"/><stop offset="1" stopColor="#20B77F" stopOpacity=".12"/></linearGradient>
    </defs>
    <path className="logo-trace logo-trace-main" pathLength="1" d="M431 272V163H336v108H230v92h50c42 0 65-27 78-66 6-19 10-27 20-27 19 0 31 56 47 56 15 0 26-50 39-88 8-24 15-41 27-41 14 0 23 19 29 35" stroke={`url(#${green})`} strokeWidth="18" strokeLinejoin="miter"/>
    <path className="logo-trace logo-trace-cross" pathLength="1" d="M497 262h50v110H440v107H328v-93" stroke={`url(#${green})`} strokeWidth="18" strokeLinejoin="miter"/>
    <path className="logo-fade" d="M511 226c7 10 13 22 18 33" stroke={`url(#${fade})`} strokeWidth="18"/>
    <path className="logo-pixels" d="M500 163h19v20h-19zM538 143h18v20h-18zM538 170h18v19h-18z" fill="#22B780"/>
  </svg>;
}
