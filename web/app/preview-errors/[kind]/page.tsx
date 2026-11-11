import { notFound } from "next/navigation";
import { ErrorPreview } from "../../../components/error-preview";

export default async function PreviewErrorPage({ params }: { params: Promise<{ kind: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { kind } = await params;
  if (kind !== "timeout" && kind !== "error") notFound();
  return <ErrorPreview kind={kind} />;
}
