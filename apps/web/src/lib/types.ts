// Tipos que espelham as respostas da API NestJS (apps/api).
// Se a API mudar um campo, o TypeScript aponta todos os lugares a ajustar aqui no front.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: string;
  email: string;
  name: string;
}

// Resposta de POST /auth/register e POST /auth/login
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // data em texto ISO 8601, ex.: "2026-12-31T00:00:00.000Z"
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Corpo aceito por POST /tasks (o PATCH aceita os mesmos campos, todos opcionais)
export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null; // null = remover o prazo
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Fazendo",
  DONE: "Feito",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];
