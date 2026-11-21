# FlowMind · Web

Front-end do FlowMind AI: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, com Zustand para a sessão e dnd-kit para o quadro de tarefas.

## Como rodar

Pré-requisitos: o Postgres do `docker-compose.yml` (raiz) e a API (`apps/api`) rodando em `http://localhost:3000`.

```bash
cp .env.example .env.local   # endereço da API (NEXT_PUBLIC_API_URL)
npm install
npm run dev                  # http://localhost:3001
```

A API só aceita chamadas do navegador vindas das origens em `WEB_ORIGIN` (`apps/api/.env`), que por padrão é `http://localhost:3001`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento na porta 3001 |
| `npm run build` | build de produção (também confere os tipos) |
| `npm run start` | serve o build de produção na porta 3001 |
| `npm run lint` | ESLint com as regras do Next e do React |

## Organização

```
src/
├── app/
│   ├── layout.tsx              layout raiz: fontes, metadados, tema
│   ├── globals.css             design tokens (claro/escuro) ligados ao Tailwind
│   ├── page.tsx                "/" redireciona para /dashboard
│   ├── login/page.tsx          tela de login e cadastro
│   └── (app)/                  grupo de rotas logadas (não aparece na URL)
│       ├── layout.tsx          AuthGate + barra lateral
│       └── dashboard/page.tsx  quadro de tarefas
├── components/
│   ├── auth/                   tela de login/cadastro
│   ├── board/                  quadro, colunas, cartões, diálogo de tarefa
│   ├── app-shell.tsx           barra lateral
│   └── auth-gate.tsx           redireciona para /login sem sessão
├── lib/
│   ├── api.ts                  cliente HTTP da API (token, erros, 401)
│   ├── types.ts                tipos que espelham as respostas da API
│   └── dates.ts                datas de prazo (formatadas em UTC)
└── stores/
    └── auth-store.ts           Zustand: token JWT + usuário, salvos no localStorage
```

## Decisões e limites conhecidos

- **Sessão no `localStorage`** (via Zustand `persist`): simples e suficiente para o estudo, mas um script injetado (XSS) conseguiria ler o token. Melhoria futura: sessão em cookie `httpOnly`.
- **Telas logadas renderizam só no navegador** (`use(browser())` do React 19.3), porque o token não existe no servidor. A segurança real está na API: sem token válido, ela responde 401 e o front encerra a sessão.
- **Arrastar e soltar acessível:** mouse, toque e teclado (espaço pega/solta, setas trocam de coluna, Esc cancela, Enter abre a tarefa), com anúncios em português para leitores de tela.
