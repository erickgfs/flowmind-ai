import type { Metadata } from "next";
import { TaskBoard } from "@/components/board/task-board";

export const metadata: Metadata = { title: "Tarefas" };

export default function DashboardPage() {
  return <TaskBoard />;
}
