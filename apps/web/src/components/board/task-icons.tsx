import { Circle, CircleCheck, CircleDotDashed } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/types";

// Ícone de status: vazio (a fazer), tracejado (fazendo), com check (feito).
// A forma muda, não só a cor: quem não distingue cores também entende.
export function StatusIcon({ status, className = "size-4" }: { status: TaskStatus; className?: string }) {
  if (status === "DONE") return <CircleCheck className={`${className} text-success`} aria-hidden="true" />;
  if (status === "IN_PROGRESS")
    return <CircleDotDashed className={`${className} text-priority-medium`} aria-hidden="true" />;
  return <Circle className={`${className} text-muted`} aria-hidden="true" />;
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-priority-high",
  MEDIUM: "bg-priority-medium",
  LOW: "bg-priority-low",
};

// Bolinha colorida + texto. O texto garante que a prioridade não dependa só da cor.
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
      <span className={`size-2 rounded-full ${PRIORITY_DOT[priority]}`} aria-hidden="true" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
