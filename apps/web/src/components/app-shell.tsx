"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LogOut, SquareKanban } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Logo } from "./logo";

// Moldura das telas logadas: barra lateral (no celular, barra no topo) + área principal.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-2 border-b border-border bg-surface px-3 py-2 md:sticky md:top-0 md:h-screen md:w-[232px] md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-3 md:py-4">
        <div className="px-2 md:mb-6">
          <Logo />
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-row gap-1 md:flex-col">
          <Link
            href="/dashboard"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-subtle hover:text-foreground aria-[current=page]:bg-accent-soft aria-[current=page]:text-foreground"
          >
            <SquareKanban className="size-4" aria-hidden="true" />
            Tarefas
          </Link>
          <span
            aria-disabled="true"
            title="Chega na fase de IA"
            className="hidden cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-muted/60 md:flex"
          >
            <FileText className="size-4" aria-hidden="true" />
            Documentos
            <span className="ml-auto rounded border border-border px-1.5 text-[11px]">em breve</span>
          </span>
        </nav>

        <div className="flex items-center gap-2 md:border-t md:border-border md:pt-3">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent"
          >
            {initials}
          </span>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate font-medium">{user?.name}</p>
            <p className="truncate text-[12px] text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-subtle hover:text-foreground"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
