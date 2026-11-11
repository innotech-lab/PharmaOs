"use client";

import "./styles.css";
import { ErrorScreen } from "../components/error-screen";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="fr"><body><ErrorScreen kind="error" retry={reset} /></body></html>;
}
