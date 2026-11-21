import { Suspense, type ReactNode } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";
import { FullPageLoader } from "@/components/full-page-loader";

// (app) é um "grupo de rotas": os parênteses NÃO entram na URL (/dashboard, não /app/dashboard).
// Ele existe só para que todas as telas logadas compartilhem este layout: guarda + barra lateral.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </Suspense>
  );
}
