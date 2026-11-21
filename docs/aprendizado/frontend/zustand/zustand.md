# 🎓 Aula: Zustand (estado global) e sessão no front-end
> **Categoria:** `frontend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 15 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/Y4W2XrYqAhpub8wwwyM5f3) · arquivo local [`zustand.html`](./zustand.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 12: [React](../react/react.md)**: estado (`useState`) e componentes.
- **Aula 9: [Autenticação com JWT e bcrypt](../../backend/jwt-bcrypt/jwt-bcrypt.md)**: o que é o token JWT que vamos guardar e por que ele vai no cabeçalho `Authorization: Bearer`.
- **Aula 13: [Next.js](../nextjs/nextjs.md)**: por que algumas telas só renderizam no navegador.
- **`localStorage` (em poucas linhas):** um pequeno armário de textos que cada site tem dentro do seu navegador. O que você guarda lá continua depois de fechar a aba ou dar F5: `localStorage.setItem("chave", "valor")`.

### 🎯 O que é e qual problema resolve
**O problema.** Depois do login, **vários** componentes precisam saber quem está logado: a barra lateral mostra o nome, o cliente da API precisa do token, a guarda de rota precisa saber se existe sessão, e o botão "Sair" precisa apagar tudo. Com `useState` só, o dado nasce num componente e precisa ser **repassado por props** de pai para filho até chegar em quem usa, atravessando componentes que nem se importam com ele (*prop drilling*). E ao dar F5, o estado do React some: o usuário seria deslogado a cada recarga.

**A solução.** O **Zustand** cria uma **store**: um estado que mora **fora** dos componentes e que qualquer um pode ler com um hook (`useAuthStore`). Quando o estado muda, só os componentes que leem **aquele pedaço** desenham de novo. Com o *middleware* `persist`, a store se grava sozinha no `localStorage` e se recarrega ao abrir o site.

**Analogia: o quadro de avisos do escritório.**
- Sem Zustand, o recado "a Ana está logada" passa **de mão em mão** pela fila de mesas (props), inclusive por quem não precisa dele.
- Com Zustand, há um **quadro de avisos na parede** (a store). Quem precisa do recado olha direto no quadro; quem não precisa nem percebe.
- Cada pessoa olha **só a linha que interessa** (o *seletor*): a barra lateral lê o nome; a guarda lê se existe token.
- O `persist` é a **foto do quadro tirada ao fim do expediente**: no dia seguinte (F5), o quadro é remontado igual.

*Onde a analogia falha:* um quadro de avisos de escritório fica num lugar seguro. O `localStorage` é legível por **qualquer** JavaScript que rode na página. Se o site tiver uma falha que permita injetar script (XSS), o token pode ser roubado. Veja "Por trás dos panos".

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Estado global** | Dado compartilhado por vários componentes, independente da posição deles na árvore. |
| **Prop drilling** | Repassar uma prop por vários níveis só para ela chegar num componente lá embaixo. |
| **Zustand** | Biblioteca pequena de estado global para React, baseada em hooks. |
| **Store** | O "objeto" que guarda o estado e as funções que o alteram. |
| **`create`** | Função do Zustand que cria a store e devolve o hook para usá-la. |
| **`set`** | Função recebida pela store para alterar o estado (mescla os campos passados). |
| **Ação** | Função da store que muda o estado: `setSession`, `logout`. |
| **Seletor** | Função que escolhe um pedaço do estado: `(s) => s.user`. |
| **`getState()`** | Lê a store fora de um componente React (num arquivo comum, como o cliente da API). |
| **Middleware** | Uma "camada" que acrescenta comportamento à store; aqui, `persist`. |
| **`persist`** | Middleware que salva a store num armazenamento (o `localStorage`) e a recarrega. |
| **`partialize`** | Opção do `persist` que escolhe **quais** campos salvar. |
| **Hidratação da store** | Recarregar o estado salvo quando o site abre. |
| **XSS** | Falha em que um script malicioso consegue rodar dentro do seu site. |
| **Cookie `httpOnly`** | Cookie que o navegador envia ao servidor mas que o JavaScript da página **não** consegue ler. |

### 🏗️ Como funciona no nosso projeto
**A store** (`apps/web/src/stores/auth-store.ts`):
```ts
interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;   // ação: após login/cadastro
  logout: () => void;                                 // ação: botão Sair, ou 401 da API
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "flowmind-auth",                                        // chave no localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }), // salva só os dados
    },
  ),
);
```

**Quem lê o quê:**
| Onde | Lê | Para quê |
|---|---|---|
| `components/auth-gate.tsx` | `(s) => s.token` | sem token → `/login` |
| `components/auth/auth-screen.tsx` | `token`, `setSession` | grava a sessão após login; se já logado → `/dashboard` |
| `components/app-shell.tsx` | `(s) => s.user`, `logout` | nome/e-mail na barra lateral; botão Sair |
| `lib/api.ts` (fora do React) | `useAuthStore.getState().token` | monta `Authorization: Bearer <token>` |
| `lib/api.ts` | `useAuthStore.getState().logout()` | API respondeu 401 → encerra a sessão |

**O fluxo do 401** é bonito de ver: o cliente da API chama `logout()`, a store muda, o `AuthGate` (que lê `token`) desenha de novo, percebe que não há token e redireciona para o login. Nenhum componente precisou "avisar" o outro.

### 🧠 Conceito Teórico / Por trás dos panos
**Como o Zustand avisa os componentes.** A store é um objeto JavaScript comum com uma lista de "ouvintes". Cada `useAuthStore(seletor)` se inscreve como ouvinte. Quando um `set(...)` acontece, o Zustand roda o seletor de cada ouvinte e compara o resultado novo com o anterior (`Object.is`). **Só** quem viu o pedaço mudar desenha de novo. Por isso, use seletores pequenos:
```ts
const user = useAuthStore((s) => s.user);   // ✅ re-renderiza só quando o usuário muda
const tudo = useAuthStore();                // ⚠️ re-renderiza a cada mudança de qualquer campo
```

**Ler fora do React.** Hooks só funcionam dentro de componentes. Mas a store existe fora deles, então `useAuthStore.getState()` lê o valor atual de qualquer lugar. É assim que o `lib/api.ts` pega o token sem ser um componente.

**O `persist` e a hidratação.** Ao ser criado no navegador, o `persist` lê `localStorage["flowmind-auth"]`, que contém algo como:
```json
{"state":{"token":"eyJhbGciOi...","user":{"id":"...","email":"ana@flowmind.dev","name":"Ana"}},"version":0}
```
Como o `localStorage` é **síncrono**, a store já nasce hidratada no primeiro render do navegador. No servidor não há `localStorage`: é por isso que as telas que leem a store ficam atrás de `use(browser())` (aula 13).

**O dilema de segurança: `localStorage` × cookie `httpOnly`.**
| | `localStorage` + Zustand (o nosso) | Cookie `httpOnly` |
|---|---|---|
| JavaScript da página consegue ler? | **Sim** | Não |
| Risco se houver XSS | o token pode ser **roubado** e usado em outro lugar | o script pode agir na página, mas não leva o token embora |
| Enviado automaticamente? | não: o código coloca no cabeçalho | sim: o navegador manda em todo pedido (exige cuidado com CSRF) |
| Complexidade | baixa | maior (cookies entre portas/domínios, CSRF) |

O guia oficial do Next recomenda cookie `httpOnly` para produção. No FlowMind ficamos com o `localStorage` por ser o pedido desta fase e por ser mais simples de estudar, e registramos a migração como melhoria futura. Para reduzir o risco hoje: o token vale só 1 hora, e o React já escapa todo texto exibido (o que dificulta XSS).

### 🛠️ Comandos e Operação
```bash
cd apps/web
npm ls zustand            # versão instalada (5.1.x)
npm run dev               # http://localhost:3001
```
No navegador (F12):
- **Application → Local Storage → http://localhost:3001 → `flowmind-auth`**: veja o token e o usuário salvos. Apagar a chave e dar F5 = deslogar.
- **Console:** `JSON.parse(localStorage.getItem("flowmind-auth")).state.user` mostra o usuário logado.
- Extensão **Redux DevTools**: o Zustand se conecta a ela se você adicionar o middleware `devtools`, e mostra cada mudança de estado.

### 🧪 Experimente você mesmo
Vamos ver a store em ação e provar que só quem lê um pedaço re-renderiza.

1. **Suba** API e front, entre em `http://localhost:3001` e faça login.
2. **Veja a foto do quadro:** F12 → *Application* → *Local Storage* → `flowmind-auth`. Esperado: `{"state":{"token":"eyJ...","user":{...}},"version":0}`.
3. **Mude a store pelo console:** no *Console*, rode:
   ```js
   const s = JSON.parse(localStorage.getItem("flowmind-auth"));
   s.state.user.name = "Nome Trocado";
   localStorage.setItem("flowmind-auth", JSON.stringify(s));
   location.reload();
   ```
   Esperado: a barra lateral mostra "Nome Trocado" e as iniciais "NT". O nome veio do `localStorage`, não da API. Prova de que **o front confia no que está guardado** e de que **nunca devemos decidir permissões no front**.
4. **Estrague o token:** repita o passo 3 trocando `s.state.token = "invalido"`. Esperado: a busca de tarefas recebe 401, o cliente chama `logout()` e você cai em `/login`. Quem decide é a API.
5. **Sair:** faça login de novo e clique em "Sair". Esperado: a chave `flowmind-auth` fica com `"token":null,"user":null`.
6. **Desfaça:** nada a desfazer no código. Para limpar de vez, apague a chave `flowmind-auth` no *Application*.

### ⚠️ Armadilhas Comuns
- **Desestruturar a store inteira** (`const { user, token } = useAuthStore()`). Funciona, mas o componente desenha de novo a cada mudança de qualquer campo. Use um seletor por valor.
- **Seletor que cria objeto novo** (`useAuthStore((s) => ({ user: s.user, token: s.token }))`). No Zustand 5 isso gera um objeto novo a cada render e pode causar loop (`Maximum update depth exceeded`). Use dois seletores, ou o `useShallow` do Zustand.
- **Ler a store no servidor.** Sintoma: o token vem `null` no primeiro HTML e aparece o aviso de hidratação. Correção: ler só em componentes do navegador (nosso `use(browser())`).
- **Salvar funções ou dados enormes no `persist`.** O `partialize` existe para gravar só o necessário (token e usuário).
- **Guardar dados do servidor (lista de tarefas) na store global "por hábito".** As tarefas pertencem ao quadro e são buscadas da API; deixamos em `useState` no `TaskBoard`. Store global é para o que é **realmente compartilhado** (a sessão).
- **Achar que esconder um botão protege algo.** Qualquer um edita o `localStorage` (passo 3 do exercício). Permissão de verdade fica na API.

### 🤔 Por que usamos / Quando usar
- **Pequeno e direto**: uma função `create`, sem *providers* nem *reducers*.
- **Funciona fora do React** (`getState()`), ideal para o cliente da API.
- **`persist` pronto** para manter a sessão entre recargas.
- Re-renderiza só quem precisa (seletores).

Alternativas: **Context API** do React (sem biblioteca; bom para dados que mudam pouco, como o tema), **Redux Toolkit** (mais estrutura e ferramentas; comum em empresas grandes), **Jotai** (estado em "átomos" pequenos). Para **dados que vêm do servidor** (listas, cache, recarregar ao voltar para a aba), bibliotecas como **TanStack Query** ou **SWR** costumam ser melhores que uma store global.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do escritório, o que são a store, o seletor e o <code>persist</code>?</summary>

A store é o quadro de avisos na parede. O seletor é cada pessoa olhando só a linha que interessa. O `persist` é a foto do quadro ao fim do expediente, usada para remontá-lo no dia seguinte (F5).
</details>

<details><summary>2. Como o <code>lib/api.ts</code> pega o token se ele não é um componente?</summary>

Com `useAuthStore.getState().token`. A store existe fora do React; o hook é só uma forma de os componentes se inscreverem nela.
</details>

<details><summary>3. O que acontece, passo a passo, quando a API responde 401?</summary>

O cliente chama `useAuthStore.getState().logout()`, o token vira `null`, o `AuthGate` (que lê `token`) desenha de novo, vê que não há sessão e redireciona para `/login`.
</details>

<details><summary>4. Qual o risco de guardar o token no <code>localStorage</code>?</summary>

Qualquer JavaScript que rode na página consegue lê-lo. Se houver uma falha de XSS, o token pode ser roubado. Um cookie `httpOnly` evita isso porque o JavaScript não o enxerga.
</details>

<details><summary>5. Por que as tarefas ficam em <code>useState</code> no quadro e não na store?</summary>

Porque só o quadro usa a lista, e ela vem da API. Store global é para o que é realmente compartilhado por várias partes da tela, como a sessão.
</details>
