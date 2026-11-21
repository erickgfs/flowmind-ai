import type { Metadata } from "next";
import { TaskBoard } from "@/components/board/task-board";

export const metadata: Metadata = { title: "Tarefas" };

// Desliga a validação de "navegação instantânea" do Next (modo dev) para esta página.
// O layout (app) só renderiza no navegador — use(browser()) no AuthGate, porque o token
// mora no localStorage —, então o Next não consegue simulá-lo no servidor e acusava
// "Could not validate `instant`". A navegação continua instantânea na prática: o
// Zustand já tem a sessão na memória. Toda página nova dentro de (app) precisa disto.
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md
export const instant = false;

export default function DashboardPage() {
  return <TaskBoard />;
}
