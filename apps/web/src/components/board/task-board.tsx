"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { CircleAlert, Plus, RotateCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { STATUSES, STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";
import { TaskDialog, type DialogState } from "./task-dialog";

// Teclado: cada seta leva o cartão direto para a coluna vizinha
// (o padrão do dnd-kit andaria só 25px por tecla).
const jumpBetweenColumns: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const rect = context.collisionRect;
  if (!rect) return;
  const step = ["ArrowRight", "ArrowDown"].includes(event.code) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.code) ? -1 : 0;
  if (step === 0) return;
  event.preventDefault(); // não rola a página

  // Colunas em ordem de leitura: lado a lado no computador, empilhadas no celular.
  const columns = [...context.droppableRects.values()].sort((a, b) => a.top - b.top || a.left - b.left);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const current = columns.findIndex((c) => cx >= c.left && cx <= c.right && cy >= c.top && cy <= c.bottom);
  const target = columns[current + step];
  if (current === -1 || !target) return currentCoordinates;

  return {
    x: currentCoordinates.x + (target.left + target.width / 2 - cx),
    y: currentCoordinates.y + (target.top + Math.min(48, target.height / 2) - cy),
  };
};

// Qual coluna está "embaixo" do cartão?
// Mouse/toque: a coluna sob o PONTEIRO (o que a pessoa espera).
// Teclado (não há ponteiro): a coluna que mais se sobrepõe ao cartão.
const columnUnderPointer: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[] | null>(null); // null = ainda carregando
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // muda = buscar de novo

  // Busca as tarefas quando o quadro aparece (e a cada "Tentar de novo").
  // setState só acontece DEPOIS da resposta, nunca de forma síncrona no efeito.
  // "ignore" descarta uma resposta que chegue depois de o quadro sair da tela.
  useEffect(() => {
    let ignore = false;
    api
      .listTasks()
      .then((data) => !ignore && setTasks(data))
      .catch((e) => {
        if (!ignore) setLoadError(e instanceof ApiError ? e.message : "Não foi possível carregar as tarefas.");
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Chamado por um clique (evento), não por efeito: aqui o setState síncrono é o normal.
  function retry() {
    setLoadError(null);
    setTasks(null);
    setReloadKey((k) => k + 1);
  }

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const task of tasks ?? []) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  // Sensores = formas de começar a arrastar.
  // Mouse/toque só "pega" depois de mover 4px: um clique simples continua abrindo a tarefa.
  // Teclado: espaço pega e solta, Esc cancela (Enter fica livre para abrir a tarefa).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
      coordinateGetter: jumpBetweenColumns,
    }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActionError(null);
    setActiveTask(tasks?.find((t) => t.id === active.id) ?? null);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over || !tasks) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as TaskStatus;
    if (!task || task.status === newStatus) return;

    // Atualização OTIMISTA: muda a tela na hora, antes da API responder.
    // Se a API recusar, desfazemos e avisamos.
    setTasks((current) => current?.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)) ?? current);
    try {
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTasks((current) => current?.map((t) => (t.id === updated.id ? updated : t)) ?? current);
    } catch (e) {
      setTasks((current) => current?.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)) ?? current);
      setActionError(
        `Não foi possível mover "${task.title}". ${e instanceof ApiError ? e.message : ""}`.trim(),
      );
    }
  }

  function handleSaved(saved: Task) {
    setTasks((current) => {
      if (!current) return [saved];
      const exists = current.some((t) => t.id === saved.id);
      return exists ? current.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...current];
    });
    setDialog(null);
  }

  function handleDeleted(id: string) {
    setTasks((current) => current?.filter((t) => t.id !== id) ?? current);
    setDialog(null);
  }

  // Textos lidos por leitores de tela durante o arrastar (o padrão do dnd-kit é em inglês).
  const titleOf = (id: string | number) => tasks?.find((t) => t.id === id)?.title ?? "tarefa";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tarefa "${titleOf(active.id)}" selecionada.`,
    onDragOver: ({ over }) => (over ? `Sobre a coluna ${STATUS_LABEL[over.id as TaskStatus]}.` : "Fora das colunas."),
    onDragEnd: ({ active, over }) =>
      over
        ? `Tarefa "${titleOf(active.id)}" movida para ${STATUS_LABEL[over.id as TaskStatus]}.`
        : "Tarefa solta fora das colunas. Nada mudou.",
    onDragCancel: () => "Movimento cancelado.",
  };

  const total = tasks?.length ?? 0;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tarefas</h1>
          <p className="text-muted">
            {tasks === null ? "Carregando…" : total === 0 ? "Nenhuma tarefa ainda" : `${total} ${total === 1 ? "tarefa" : "tarefas"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ mode: "create", status: "TODO" })}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nova tarefa
        </button>
      </div>

      {actionError && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {actionError}
        </p>
      )}

      {loadError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5">
          <p className="flex items-center gap-2 font-medium text-danger">
            <CircleAlert className="size-4" aria-hidden="true" />
            {loadError}
          </p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 hover:bg-subtle"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Tentar de novo
          </button>
        </div>
      ) : tasks === null ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={columnUnderPointer}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTask(null)}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable:
                "Para mover a tarefa, pressione espaço. Use as setas para ir a outra coluna e espaço para soltar. Esc cancela. Enter abre a tarefa.",
            },
          }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            {STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={byStatus[status]}
                onOpen={(task) => setDialog({ mode: "edit", task })}
                onCreate={(s) => setDialog({ mode: "create", status: s })}
              />
            ))}
          </div>
          {/* Cópia do cartão que acompanha o mouse/teclado enquanto arrasta */}
          <DragOverlay dropAnimation={null}>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
        </DndContext>
      )}

      {dialog && (
        <TaskDialog
          // key: cada tarefa aberta recria o diálogo com o estado inicial dela
          key={dialog.mode === "edit" ? dialog.task.id : `new-${dialog.status}`}
          state={dialog}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

// Esqueleto com o formato do quadro enquanto as tarefas chegam: evita a tela "pular".
function BoardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3" aria-hidden="true">
      {STATUSES.map((s) => (
        <div key={s} className="flex flex-col gap-2 rounded-card bg-subtle p-2">
          <div className="mx-1 my-1.5 h-4 w-24 animate-pulse rounded bg-border" />
          {[0, 1].map((i) => (
            <div key={i} className="h-18 animate-pulse rounded-card border border-border bg-surface" />
          ))}
        </div>
      ))}
    </div>
  );
}
