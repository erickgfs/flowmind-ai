import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { FullPageLoader } from "@/components/full-page-loader";

export const metadata: Metadata = { title: "Entrar" };

// Página de servidor fina: define o título e delega a tela ao componente de cliente.
// O <Suspense> é obrigatório porque o AuthScreen usa use(browser()) e suspende no servidor.
export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AuthScreen />
    </Suspense>
  );
}
