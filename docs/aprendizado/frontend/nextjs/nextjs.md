# 🎓 Aula: Next.js (App Router)
> **Categoria:** `frontend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 13 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/TEpPm7rGCdQt4SeBebTFhK) · arquivo local [`nextjs.html`](./nextjs.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 12: [React](../react/react.md)**. Next.js é um framework **em cima** do React: componentes, estado e efeitos continuam iguais.
- **Aula 6: [NestJS](../../backend/nestjs/nestjs.md)**, para entender que o front conversa com uma API separada.
- **Servidor × navegador (em poucas linhas):** o **servidor** é o computador que entrega a página; o **navegador** é o programa (Chrome, Edge) que a exibe e roda o JavaScript dela. Algumas coisas só existem no navegador, como o `localStorage` (um "armário" de dados guardado no seu navegador) e a janela (`window`).

### 🎯 O que é e qual problema resolve
**O problema.** O React sozinho só desenha componentes. Para um site de verdade ainda faltam várias peças: **rotas** (`/login`, `/dashboard`), carregar só o código de cada página, título de cada aba, fontes, imagens otimizadas, variáveis de ambiente, compilar o TypeScript e gerar uma versão rápida para produção. Montar tudo isso à mão é trabalhoso e cheio de detalhes.

**A solução.** O **Next.js** é um *framework* de React que traz essas peças prontas e organizadas por **convenção de pastas**: a pasta `app/login/` com um `page.tsx` dentro **vira** a rota `/login`. Ele também decide o que roda no **servidor** e o que roda no **navegador**, e pré-renderiza HTML para a página aparecer rápido.

**Analogia: o shopping center.**
- Cada **rota** é uma **loja** com endereço fixo no mapa (a pasta é o endereço).
- O **`layout.tsx`** é o **corredor e a vitrine em comum**: piso, placas e iluminação que várias lojas compartilham (no FlowMind, a barra lateral das telas logadas).
- O **`page.tsx`** é o **interior da loja**, o que muda de endereço para endereço.
- Os **Server Components** são o **estoque nos fundos**: trabalham longe do cliente e entregam o produto pronto. Os **Client Components** são o **balcão de atendimento**: interagem com quem entrou (cliques, digitação).
- O **grupo de rotas `(app)`** é uma **ala do shopping com segurança na porta**: as lojas dessa ala têm a mesma regra de entrada, mas o nome da ala não aparece no endereço.

*Onde a analogia falha:* num shopping, estoque e balcão são lugares diferentes e fixos. No Next.js, o mesmo componente de cliente é **pré-renderizado no servidor** (para mandar um HTML inicial) e depois "acorda" no navegador. Por isso existe a fronteira `use(browser())`, que vamos ver.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Framework** | Estrutura pronta que define como organizar e montar o projeto. |
| **Next.js** | Framework de React com rotas por pastas, renderização no servidor e build otimizado. |
| **App Router** | O sistema de rotas do Next baseado na pasta `app/`. |
| **Rota** | Endereço de uma tela, como `/dashboard`. |
| **`page.tsx`** | Arquivo que define o conteúdo de uma rota. |
| **`layout.tsx`** | Moldura compartilhada pelas rotas daquela pasta e das subpastas. |
| **Grupo de rotas `(nome)`** | Pasta entre parênteses que organiza rotas sem aparecer na URL. |
| **Server Component** | Componente que roda só no servidor (padrão no App Router); não tem estado nem cliques. |
| **Client Component** | Componente marcado com `"use client"`; roda no navegador e pode ter estado, efeitos e eventos. |
| **Pré-renderizar** | Gerar o HTML de uma página antes de alguém pedir (no build). |
| **Hidratação** | O momento em que o React, no navegador, "assume" o HTML pré-renderizado e liga os cliques. |
| **`use(browser())`** | API do React 19.3 que marca uma parte como "só renderiza no navegador". |
| **`<Suspense>`** | Mostra um *fallback* enquanto a parte de dentro não pode aparecer. |
| **`redirect()`** | Função do Next que manda o visitante para outra rota. |
| **`NEXT_PUBLIC_`** | Prefixo de variável de ambiente que o Next embute no JavaScript do navegador. |
| **Cache Components** | Modo do Next 16 (ligado por padrão no nosso projeto) em que os dados são dinâmicos e você escolhe o que guardar em cache. |
| **Turbopack** | O empacotador (*bundler*) padrão do Next 16, que transforma o código em arquivos para o navegador. |

### 🏗️ Como funciona no nosso projeto
O front fica em `apps/web` e roda na porta **3001** (a API ocupa a 3000):
```
apps/web/src/app/
├── layout.tsx               raiz: <html lang="pt-BR">, fontes Geist, título "%s · FlowMind"
├── globals.css              tokens de cor (aula de Tailwind)
├── page.tsx                 "/"          → redirect("/dashboard")
├── login/page.tsx           "/login"     → <Suspense><AuthScreen/></Suspense>
└── (app)/                   grupo: NÃO aparece na URL
    ├── layout.tsx           guarda (AuthGate) + barra lateral (AppShell)
    └── dashboard/page.tsx   "/dashboard" → <TaskBoard/>
```

**Página de servidor fina, componente de cliente gordo** (`app/login/page.tsx`):
```tsx
// Sem "use client": é um Server Component. Só define o título e monta a tela.
export const metadata: Metadata = { title: "Entrar" };   // aba: "Entrar · FlowMind"

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>   {/* o que o servidor consegue mostrar */}
      <AuthScreen />                            {/* "use client": formulário, estado, cliques */}
    </Suspense>
  );
}
```

**A guarda das telas logadas** (`components/auth-gate.tsx`):
```tsx
"use client";
export function AuthGate({ children }: { children: ReactNode }) {
  use(browser("A sessão fica no localStorage, disponível só no navegador."));
  const token = useAuthStore((s) => s.token);        // Zustand (aula 15)
  const router = useRouter();
  useEffect(() => { if (!token) router.replace("/login"); }, [token, router]);
  if (!token) return <FullPageLoader label="Redirecionando para o login…" />;
  return <>{children}</>;
}
```

**Variável de ambiente para o navegador** (`apps/web/.env.example`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000   # embutida no JS no build; NUNCA coloque segredo aqui
```

### 🧠 Conceito Teórico / Por trás dos panos
**Server × Client Components.** No App Router, todo componente é de **servidor** até que um arquivo diga `"use client"`. Componente de servidor pode acessar coisas do servidor e não manda JavaScript para o navegador. Componente de cliente pode usar `useState`, `useEffect`, cliques e APIs do navegador. A regra: deixe as páginas no servidor e coloque `"use client"` só nas "folhas" interativas.

**Por que o FlowMind usa `use(browser())`.** O token mora no `localStorage`, que **não existe no servidor**. No `next build`, o Next pré-renderiza até os componentes de cliente. Se o `AuthGate` rodasse no servidor, ele acharia que "não há token" e o HTML diria "Redirecionando…", enquanto o navegador, que tem o token, desenharia o quadro. As duas versões não bateriam (*erro de hidratação*). Com `use(browser(...))`:
1. No **build/servidor**: o componente **suspende**; o Next grava no HTML o `fallback` do `<Suspense>` ("Carregando…").
2. No **navegador**: `browser()` não suspende; a store do Zustand já leu o `localStorage`, e o componente desenha o quadro ou redireciona.

O resultado aparece no build: todas as rotas saem como `○ (Static)`, um HTML estático rápido com o "Carregando…" que vira a tela real em milissegundos.

**Cuidado: a guarda é conveniência, não segurança.** Qualquer pessoa pode editar o JavaScript no próprio navegador. O que protege os dados é a **API**: sem um token válido, o `AuthGuard` do NestJS responde 401, e o nosso cliente (`lib/api.ts`) encerra a sessão.

**`NEXT_PUBLIC_` é "colado" no build.** O Next troca `process.env.NEXT_PUBLIC_API_URL` pelo valor literal na hora do `next build`. Mudar o `.env.local` depois exige um novo build. Variáveis **sem** o prefixo existem só no servidor.

**Next 16 é novo.** O `create-next-app` gerou um `AGENTS.md` avisando que a versão tem mudanças grandes, e a documentação completa vem dentro do pacote, em `node_modules/next/dist/docs/`. Algumas novidades: Turbopack como padrão, `middleware` renomeado para `proxy`, e o **Cache Components** (`cacheComponents: true`) ligado, em que nada é guardado em cache a menos que você use `"use cache"`. Ao navegar, o Next mantém as telas recentes "escondidas" em vez de destruí-las (componente `<Activity>` do React), por isso voltar ao quadro é instantâneo.

### 🛠️ Comandos e Operação
```bash
cd apps/web
npm run dev                 # desenvolvimento: http://localhost:3001, recarrega ao salvar
npm run build               # build de produção; também roda o TypeScript e lista as rotas
npm run start               # serve o build de produção na porta 3001
npm run lint                # ESLint com as regras do Next e dos hooks do React
npx next typegen            # gera os tipos das rotas (LayoutProps, PageProps) sem fazer build
cp .env.example .env.local  # cria o arquivo de ambiente local (fora do Git)
```
Saída esperada do `npm run build`:
```
Route (app)
┌ ○ /
├ ○ /dashboard
└ ○ /login
○  (Static)  prerendered as static content
```

### 🧪 Experimente você mesmo
Vamos criar uma rota nova dentro do grupo logado e ver a moldura compartilhada.

1. **Suba** a API e o front (`npm run dev` em cada um) e faça login.
2. **Crie** `apps/web/src/app/(app)/sobre/page.tsx`:
   ```tsx
   import type { Metadata } from "next";
   export const metadata: Metadata = { title: "Sobre" };       // aba: "Sobre · FlowMind"

   export default function SobrePage() {                        // Server Component (sem "use client")
     return <p className="p-8">O FlowMind organiza tarefas e documentação.</p>;
   }
   ```
3. **Abra** `http://localhost:3001/sobre`. Esperado: a página aparece **com a barra lateral**, porque herdou o `layout.tsx` do grupo `(app)`, e a aba mostra "Sobre · FlowMind". Repare que a URL não tem `(app)`.
4. **Teste a guarda:** clique em "Sair" e tente abrir `/sobre` de novo. Esperado: você volta para `/login`. A rota nova ficou protegida sem nenhuma linha extra.
5. **Veja o build:** pare o `dev` e rode `npm run build`. Esperado: `○ /sobre` aparece na lista de rotas.
6. **Desfaça:** apague a pasta `src/app/(app)/sobre/` e confira com `git status` que está limpo.

### ⚠️ Armadilhas Comuns
- **Usar `useState`/`onClick` sem `"use client"`.** Sintoma: `You're importing a component that needs useState. This React Hook only works in a Client Component`. Correção: `"use client"` no topo do arquivo do componente interativo.
- **Ler `localStorage`/`window` direto num componente pré-renderizado.** Sintoma: `ReferenceError: localStorage is not defined` no build, ou o aviso de hidratação `Text content does not match server-rendered HTML`. Correção: `use(browser())` dentro de um `<Suspense>` (nosso padrão), ou ler o valor dentro de um efeito.
- **`use(browser())` sem `<Suspense>` em volta.** O componente não tem o que mostrar enquanto suspende. Sempre envolva com `<Suspense fallback={...}>`.
- **Segredo em variável `NEXT_PUBLIC_`.** Ela vai parar no JavaScript que qualquer visitante baixa. Só URLs e valores públicos.
- **Mudou o `.env.local` e nada aconteceu.** O `next dev` precisa reiniciar, e o `next start` precisa de um build novo.
- **Porta ocupada** (`EADDRINUSE :::3001`). Já existe um Next rodando. No Windows, parar o `npm` às vezes deixa o processo `node ... next start` vivo: encerre-o (Gerenciador de Tarefas ou `Stop-Process`).
- **Seguir tutorial do Next 13/14 no Next 16.** Muita coisa mudou (`middleware` → `proxy`, cache, APIs assíncronas). Confira em `node_modules/next/dist/docs/`.

### 🤔 Por que usamos / Quando usar
- **Rotas, build, fontes e metadados prontos**, com convenções conhecidas pelo mercado.
- **Pré-renderização**: a página aparece rápido, mesmo antes do JavaScript carregar.
- **Caminho para crescer**: quando o FlowMind tiver documentação pública, ela pode ser renderizada no servidor e indexada pelo Google, no mesmo projeto.
- **É o framework React mais usado em vagas.**

Alternativas: **Vite + React** (só o React, sem servidor; ótimo para painéis internos simples), **Remix/React Router** (foco em formulários e carregamento de dados), **Astro** (sites de conteúdo com pouca interação).

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do shopping, o que são <code>layout.tsx</code>, <code>page.tsx</code> e o grupo <code>(app)</code>?</summary>

`layout.tsx` = corredor e vitrine em comum. `page.tsx` = o interior de cada loja. `(app)` = uma ala com segurança na porta, cujo nome não aparece no endereço.
</details>

<details><summary>2. Qual a diferença entre um Server Component e um Client Component?</summary>

O de servidor roda só no servidor e não manda JavaScript para o navegador (não tem estado nem cliques). O de cliente (`"use client"`) roda no navegador e pode usar `useState`, `useEffect` e eventos.
</details>

<details><summary>3. Por que o <code>AuthGate</code> usa <code>use(browser())</code>?</summary>

Porque o token fica no `localStorage`, que não existe no servidor. Assim o servidor pré-renderiza só o "Carregando…" do `<Suspense>`, e a decisão (mostrar o quadro ou ir para o login) acontece no navegador, sem HTML divergente.
</details>

<details><summary>4. O <code>AuthGate</code> protege os dados das tarefas?</summary>

Não. Ele só evita mostrar uma tela vazia. Quem protege é a API: sem token válido, o NestJS responde 401.
</details>

<details><summary>5. Por que não colocar o <code>JWT_SECRET</code> numa variável <code>NEXT_PUBLIC_</code>?</summary>

Porque o Next embute o valor no JavaScript enviado ao navegador, e qualquer visitante poderia lê-lo e assinar tokens falsos.
</details>
