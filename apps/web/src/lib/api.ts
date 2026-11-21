import { useAuthStore } from "@/stores/auth-store";
import type { AuthResponse, Task, TaskInput } from "./types";

// Inlinado no build pelo Next (prefixo NEXT_PUBLIC_). Ver apps/web/.env.example.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// Erro com o que a API respondeu. O NestJS devolve
//   { "message": "texto" | ["texto 1", "texto 2"], "error": "...", "statusCode": 400 }
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages[0] ?? `Erro ${status}`);
    this.name = "ApiError";
  }

  // As mensagens do ValidationPipe começam pelo nome do campo ("email deve ser...").
  // Isto agrupa por campo para mostrar cada erro embaixo do input certo.
  fieldErrors(fields: readonly string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const message of this.messages) {
      const field = fields.find((f) => message.startsWith(`${f} `));
      if (field && !result[field]) result[field] = message;
    }
    return result;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // true = manda "Authorization: Bearer <token>"
}

async function request<T>(path: string, { method = "GET", body, auth = true }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    // getState(): lê a store fora de um componente React (sem hook).
    const token = useAuthStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch só rejeita quando nem chegou resposta: API desligada, CORS bloqueado, sem rede.
    throw new ApiError(0, ["Não foi possível falar com a API. Ela está rodando em " + API_URL + "?"]);
  }

  // Token vencido ou inválido numa rota protegida: encerra a sessão local.
  if (response.status === 401 && auth) {
    useAuthStore.getState().logout();
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const raw = data?.message ?? response.statusText;
    throw new ApiError(response.status, Array.isArray(raw) ? raw : [String(raw)]);
  }

  // 204 No Content (DELETE) não tem corpo.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: data, auth: false }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: data, auth: false }),

  listTasks: () => request<Task[]>("/tasks"),
  createTask: (data: TaskInput) => request<Task>("/tasks", { method: "POST", body: data }),
  updateTask: (id: string, data: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: data }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
