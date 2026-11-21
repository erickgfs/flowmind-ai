"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { StatusIcon } from "./task-icons";
import { TaskCard } from "./task-card";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onCreate: (status: TaskStatus) => void;
}

export function BoardColumn({ status, tasks, onOpen, onCreate }: BoardColumnProps) {
  // useDroppable: esta coluna aceita cartões soltos. O id é o próprio status,
  // então no fim do arrastar "over.id" já diz para qual status a tarefa vai.
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex min-h-[200px] flex-col rounded-card border p-2 transition-colors ${
        isOver ? "border-accent bg-accent-soft" : "border-transparent bg-subtle"
      }`}
    >
      <header className="flex items-center gap-2 px-1 pt-1 pb-2">
        <StatusIcon status={status} />
        <h2 id={headingId} className="font-medium">
          {STATUS_LABEL[status]}
        </h2>
        <span className="text-muted tabular-nums">{tasks.length}</span>
        <button
          type="button"
          onClick={() => onCreate(status)}
          className="ml-auto grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
          aria-label={`Nova tarefa em ${STATUS_LABEL[status]}`}
          title="Nova tarefa"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-card border border-dashed border-border px-3 py-6 text-center text-[13px] text-muted">
            {status === "DONE" ? "Arraste para cá o que terminar." : "Nenhuma tarefa aqui."}
          </p>
        )}
      </div>
    </section>
  );
}
