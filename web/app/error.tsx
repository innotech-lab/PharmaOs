"use client";

import { ErrorScreen } from "../components/error-screen";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen kind={error.name === "TimeoutError" ? "timeout" : "error"} retry={reset} />;
}
