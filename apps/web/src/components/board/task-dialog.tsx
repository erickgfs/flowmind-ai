"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, LoaderCircle, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toDateInputValue } from "@/lib/dates";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Task, type TaskPriority, type TaskStatus } from "@/lib/types";

export type DialogState = { mode: "create"; status: TaskStatus } | { mode: "edit"; task: Task };

interface TaskDialogProps {
  state: DialogState;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (id: string) => void;
}

export function TaskDialog({ state, onClose, onSaved, onDeleted }: TaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const editing = state.mode === "edit" ? state.task : null;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(editing?.status ?? (state.mode === "create" ? state.status : "TODO"));
  const [priority, setPriority] = useState<TaskPriority>(editing?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(toDateInputValue(editing?.dueDate ?? null));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // <dialog> nativo + showModal(): o navegador cuida do fundo escurecido,
  // prende o foco dentro da janela e fecha com Esc (evento "cancel").
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // O showModal() foca o PRIMEIRO elemento focável (o X do cabeçalho), porque o
    // autoFocus do React não vira atributo no HTML. Levamos o foco ao título.
    titleRef.current?.focus();
    return () => dialog?.close();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        // Criar: sem data = não manda o campo. Editar: sem data = null (remove o prazo).
        dueDate: dueDate ? dueDate : editing ? null : undefined,
      };
      const saved = editing ? await api.updateTask(editing.id, data) : await api.createTask(data);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof ApiError ? e.messages.join(" · ") : "Não foi possível salvar.");
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) {
      setConfirmDelete(true); // 1º clique pede confirmação; o 2º exclui
      return;
    }
    setPending(true);
    try {
      await api.deleteTask(editing.id);
      onDeleted(editing.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível excluir.");
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault(); // deixa o React decidir quando fechar
        onClose();
      }}
      // Clique no fundo escurecido (fora do conteúdo) fecha o diálogo.
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="task-dialog-title"
      className="m-auto w-[min(520px,calc(100vw-32px))] rounded-lg border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="task-dialog-title" className="font-semibold">
            {editing ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-md text-muted hover:bg-subtle hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-4">
          <input
            ref={titleRef}
            id="task-title"
            aria-label="Título"
            placeholder="Título da tarefa"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-[16px] font-medium outline-none placeholder:text-muted"
          />
          <textarea
            id="task-description"
            aria-label="Descrição"
            placeholder="Adicione uma descrição…"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none bg-transparent text-muted outline-none placeholder:text-muted/70 focus:text-foreground"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Status</span>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-8 rounded-md border border-border bg-surface px-2 hover:border-border-strong"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-[12px] font-medium text-muted">Prioridade</legend>
              <div className="grid h-8 grid-cols-3 rounded-md border border-border p-0.5">
                {PRIORITIES.map((p) => (
                  <label
                    key={p}
                    className="grid cursor-pointer place-items-center rounded text-[12px] text-muted has-checked:bg-accent-soft has-checked:font-medium has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      className="sr-only"
                    />
                    {PRIORITY_LABEL[p]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-muted">Prazo</span>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 rounded-md border border-border bg-surface px-2 font-mono text-[13px] hover:border-border-strong"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-danger">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-border px-5 py-3">
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 transition-colors disabled:opacity-60 ${
                confirmDelete ? "bg-danger font-medium text-white" : "text-danger hover:bg-danger-soft"
              }`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {confirmDelete ? "Confirmar exclusão" : "Excluir"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-8 rounded-md px-3 text-muted hover:bg-subtle hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || title.trim() === ""}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-3 font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {editing ? "Salvar" : "Criar tarefa"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
