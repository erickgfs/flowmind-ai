import { LoaderCircle } from "lucide-react";

// Fallback dos <Suspense> que envolvem telas que só existem no navegador.
// É este HTML que o Next pré-renderiza no servidor (ele não conhece o localStorage).
export function FullPageLoader({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-muted" role="status">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
