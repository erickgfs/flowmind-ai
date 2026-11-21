"use client";

import { use, useEffect, type ReactNode } from "react";
import { browser } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { FullPageLoader } from "./full-page-loader";

// Porteiro das telas logadas: sem token, manda para /login.
//
// O token mora no localStorage, que só existe no navegador. Por isso:
// - use(browser(...)) diz ao React 19.3 "esta parte só renderiza no navegador".
//   No servidor ela suspende e o Next pré-renderiza o fallback do <Suspense> em volta.
// - No navegador, a store do Zustand já foi recarregada do localStorage (o persist
//   é síncrono com localStorage), então o primeiro render já sabe se há token.
//
// Isto é uma checagem de CONVENIÊNCIA (não mostrar a tela vazia). A segurança de
// verdade continua na API: sem token válido, o AuthGuard do NestJS responde 401.
export function AuthGate({ children }: { children: ReactNode }) {
  use(browser("A sessão fica no localStorage, disponível só no navegador."));

  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return <FullPageLoader label="Redirecionando para o login…" />;
  return <>{children}</>;
}
