"use client";

import type { KeyboardEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Calendar } from "lucide-react";
import type { Task } from "@/lib/types";
import { formatDueDate, isOverdue } from "@/lib/dates";
import { PriorityBadge } from "./task-icons";

interface TaskCardProps {
  task: Task;
  onOpen?: (task: Task) => void;
  overlay?: boolean; // true = cópia que segue o mouse durante o arrastar (DragOverlay)
}

export function TaskCard({ task, onOpen, overlay = false }: TaskCardProps) {
  // useDraggable devolve o que o elemento precisa para ser arrastado:
  // listeners (eventos de mouse/toque/teclado), attributes (role, tabIndex, aria-*)
  // e setNodeRef (diz ao dnd-kit qual elemento HTML é o cartão).
  // O cartão original NÃO se move: quem segue o mouse é a cópia do <DragOverlay>
  // (ver task-board.tsx). O original só fica esmaecido marcando o lugar de onde saiu.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: overlay,
  });

  const overdue = task.status !== "DONE" && isOverdue(task.dueDate);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Espaço é do dnd-kit (pega/solta o cartão). Enter abre a tarefa.
    if (event.key === "Enter" && !overlay) {
      // Sem isto, o MESMO Enter continua depois que o diálogo abre e "aperta"
      // o botão que estiver focado lá dentro (o X), fechando o diálogo na hora.
      event.preventDefault();
      onOpen?.(task);
      return;
    }
    listeners?.onKeyDown?.(event);
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      onClick={() => !overlay && onOpen?.(task)}
      aria-label={`${task.title}. Enter para abrir, espaço para mover.`}
      className={`group flex cursor-grab flex-col gap-2 rounded-card border bg-surface p-3 text-left transition-colors select-none active:cursor-grabbing ${
        overlay
          ? "cursor-grabbing border-border-strong shadow-lg shadow-black/10"
          : "border-border hover:border-border-strong"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <p className={`leading-snug font-medium ${task.status === "DONE" ? "text-muted line-through" : ""}`}>
        {task.title}
      </p>
      {task.description && <p className="line-clamp-2 text-[13px] text-muted">{task.description}</p>}
      <div className="flex items-center gap-3">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[12px] ${overdue ? "text-danger" : "text-muted"}`}
            title={overdue ? "Prazo vencido" : "Prazo"}
          >
            <Calendar className="size-3.5" aria-hidden="true" />
            {formatDueDate(task.dueDate)}
            {overdue && <span className="sr-only">(vencido)</span>}
          </span>
        )}
      </div>
    </div>
  );
}
