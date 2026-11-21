// A API guarda o prazo como meia-noite em UTC ("2026-12-31T00:00:00.000Z").
// No Brasil (UTC-3) isso é 21h do dia ANTERIOR. Por isso formatamos em UTC:
// senão o prazo "31 dez" apareceria como "30 dez".

const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

// "31 de dez." (formato do Intl em pt-BR) -> "31 dez", mais curto para o cartão
export function formatDueDate(iso: string): string {
  return formatter.format(new Date(iso)).replace(" de ", " ").replace(".", "");
}

// "2026-12-31T00:00:00.000Z" -> "2026-12-31" (formato que o <input type="date"> entende)
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

// Data de hoje no fuso do usuário, em "AAAA-MM-DD", para comparar com o prazo.
function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isOverdue(iso: string | null): boolean {
  return iso !== null && toDateInputValue(iso) < todayKey();
}
