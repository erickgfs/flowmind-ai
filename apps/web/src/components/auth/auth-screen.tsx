"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { browser } from "react-dom";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Logo } from "@/components/logo";

type Mode = "login" | "register";
const FIELDS = ["name", "email", "password"] as const;
type Field = (typeof FIELDS)[number];

export function AuthScreen() {
  use(browser("Verifica no localStorage se o usuário já está logado."));

  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Já logado? Vai direto para o quadro.
  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  function switchMode(next: Mode) {
    setMode(next);
    setFieldErrors({});
    setFormError(null);
  }

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined })); // some o erro ao corrigir
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const response =
        mode === "login"
          ? await api.login({ email: values.email, password: values.password })
          : await api.register(values);
      setSession(response.accessToken, response.user); // o useEffect acima redireciona
    } catch (error) {
      if (error instanceof ApiError) {
        const byField = error.fieldErrors(FIELDS);
        setFieldErrors(byField);
        // 401 (credenciais), 409 (e-mail em uso), API fora do ar: mensagem geral.
        if (Object.keys(byField).length === 0) setFormError(error.message);
      } else {
        setFormError("Algo deu errado. Tente de novo.");
      }
    } finally {
      setPending(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-xl font-semibold tracking-tight">
            {isRegister ? "Crie sua conta" : "Entre na sua conta"}
          </h1>
          <p className="text-muted">Tarefas e documentação num lugar só.</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          {/* Abas: um grupo de dois botões, o selecionado com aria-pressed */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-subtle p-1" role="group" aria-label="Escolha entre entrar e criar conta">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`rounded px-3 py-1.5 font-medium transition-colors ${
                  mode === m ? "bg-surface text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted hover:text-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {isRegister && (
              <TextField
                id="name"
                label="Nome"
                autoComplete="name"
                value={values.name}
                error={fieldErrors.name}
                onChange={(v) => update("name", v)}
              />
            )}
            <TextField
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={values.email}
              error={fieldErrors.email}
              onChange={(v) => update("email", v)}
            />
            <TextField
              id="password"
              label="Senha"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              hint={isRegister ? "Entre 8 e 72 caracteres." : undefined}
              value={values.password}
              error={fieldErrors.password}
              onChange={(v) => update("password", v)}
            />

            {formError && (
              <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
}

function TextField({ id, label, value, onChange, type = "text", autoComplete, error, hint }: TextFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-9 rounded-md border bg-surface px-3 outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/25 focus-visible:outline-none ${
          error ? "border-danger" : "border-border hover:border-border-strong"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
