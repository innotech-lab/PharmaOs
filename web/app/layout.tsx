import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "PharmaOS — Pilotage de votre officine",
  description: "Le poste de pilotage de votre pharmacie.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>;
}
