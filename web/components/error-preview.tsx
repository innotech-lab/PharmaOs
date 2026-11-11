"use client";

import { ErrorScreen } from "./error-screen";

export function ErrorPreview({ kind }: { kind: "timeout" | "error" }) {
  return <ErrorScreen kind={kind} retry={() => window.location.reload()} />;
}
