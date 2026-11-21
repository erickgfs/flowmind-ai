import { redirect } from "next/navigation";

// A raiz não tem conteúdo próprio: quem entra em "/" vai para o quadro.
// Se não houver sessão, o AuthGate do /dashboard manda para /login.
export default function Home() {
  redirect("/dashboard");
}
