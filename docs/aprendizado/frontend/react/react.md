# 🎓 Aula: React (componentes, estado e efeitos)
> **Categoria:** `frontend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 12 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/YLERTgyZjq4kwBBM9f5HKX) · arquivo local [`react.html`](./react.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 5: [Node.js, npm e TypeScript](../../backend/nodejs/nodejs.md)**. O React é escrito em TypeScript aqui e instalado com npm.
- **HTML em poucas linhas:** a página é feita de **tags** aninhadas: `<button>Salvar</button>`, `<input type="email">`. O navegador transforma esse texto numa árvore de objetos chamada **DOM** (*Document Object Model*), que o JavaScript consegue ler e mudar.
- **Evento:** algo que acontece na página e que o código pode "ouvir": um clique (`click`), uma tecla (`keydown`), o envio de um formulário (`submit`).

### 🎯 O que é e qual problema resolve
**O problema.** Imagine a tela de tarefas feita com JavaScript puro. Ao criar uma tarefa, você precisa: achar a coluna certa no DOM, criar o cartão à mão, atualizar o contador "3 tarefas", esconder o aviso "Nenhuma tarefa aqui"... Ao mover uma tarefa, desfazer tudo isso numa coluna e refazer na outra. Cada ação vira uma lista de "mexa aqui, mexa ali". Esqueceu um passo? A tela mostra uma coisa e os dados dizem outra.

**A solução.** No **React** você descreve **como a tela deve ficar para um certo estado** (os dados do momento), e o React descobre sozinho o que mudar no DOM. Você não escreve "adicione um cartão na coluna 2". Escreve "a coluna mostra um cartão para cada tarefa com este status". Quando os dados mudam, o React redesenha só o que for preciso.

**Analogia: a planta de um prédio e o mestre de obras.**
- O **componente** é uma **planta** reaproveitável: "um cartão de tarefa tem título, prioridade e prazo".
- As **props** são as **medidas** que você entrega para cada uso da planta: este cartão é "Estudar Next.js", prioridade alta.
- O **estado** é a **situação atual da obra**: quantas tarefas existem, qual diálogo está aberto.
- O **React** é o **mestre de obras**: você só atualiza a planta/situação; ele compara com o que já está construído e manda refazer apenas a parede que mudou.

*Onde a analogia falha:* num prédio, refazer é caro e raro. No React, "redesenhar" (renderizar) é barato e acontece o tempo todo, várias vezes por segundo se for preciso. O que é caro é mexer no DOM, e é isso que o React economiza.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **React** | Biblioteca para construir interfaces a partir de componentes que reagem a mudanças de dados. |
| **DOM** | A árvore de elementos da página que o navegador mostra. |
| **Componente** | Função que recebe dados (props) e devolve o pedaço de tela correspondente. |
| **JSX / TSX** | Sintaxe parecida com HTML dentro do JavaScript/TypeScript: `<h1>{titulo}</h1>`. |
| **Props** | Os "argumentos" de um componente, passados como atributos: `<TaskCard task={t} />`. |
| **Estado (state)** | Dado que pode mudar e, quando muda, faz o componente desenhar de novo. |
| **Renderizar** | Rodar o componente para calcular como a tela deve ficar. |
| **Hook** | Função especial do React que começa com `use` (`useState`, `useEffect`). |
| **`useState`** | Hook que cria um estado: `const [aberto, setAberto] = useState(false)`. |
| **`useEffect`** | Hook para "sincronizar com o mundo de fora" (buscar dados, mexer no `<dialog>`) depois de renderizar. |
| **`useRef`** | Hook que guarda uma referência (por exemplo, a um elemento do DOM) sem causar nova renderização. |
| **Seletor / derivado** | Valor calculado a partir do estado (ex.: tarefas agrupadas por coluna), em vez de guardado à parte. |
| **`key`** | Identificador único em listas, para o React saber qual item é qual entre uma renderização e outra. |
| **Componente controlado** | Input cujo valor vem do estado (`value={title}`) e muda via `onChange`. |
| **Suspense** | Componente que mostra um *fallback* ("Carregando…") enquanto algo dentro dele ainda não pode aparecer. |

### 🏗️ Como funciona no nosso projeto
Todo o front em `apps/web/src/components/` é React. Exemplos reais:

**Um componente com props** (`board/task-icons.tsx`):
```tsx
// Recebe a prioridade por props e devolve uma bolinha colorida + o texto.
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${PRIORITY_DOT[priority]}`} aria-hidden="true" />
      {PRIORITY_LABEL[priority]}  {/* chaves = "coloque o valor desta expressão aqui" */}
    </span>
  );
}
```

**Estado + lista com `key`** (`board/task-board.tsx`, simplificado):
```tsx
const [tasks, setTasks] = useState<Task[] | null>(null);   // null = ainda carregando

// Valor DERIVADO: calculado a cada renderização a partir de "tasks", nunca guardado separado.
const byStatus = useMemo(() => agruparPorStatus(tasks), [tasks]);

return STATUSES.map((status) => (
  <BoardColumn key={status} status={status} tasks={byStatus[status]} />  // key: identifica cada coluna
));
```

**Componente controlado** (`board/task-dialog.tsx`):
```tsx
const [title, setTitle] = useState(editing?.title ?? "");
<input value={title} onChange={(e) => setTitle(e.target.value)} />
// O input mostra SEMPRE o que está no estado; cada tecla atualiza o estado.
```

**Efeito com limpeza** (`board/task-board.tsx`): buscar as tarefas quando o quadro aparece.
```tsx
useEffect(() => {
  let ignore = false;                                  // virou true? a resposta chegou tarde demais
  api.listTasks().then((data) => !ignore && setTasks(data));
  return () => { ignore = true; };                     // "limpeza": roda quando o quadro sai da tela
}, [reloadKey]);                                       // roda de novo quando reloadKey muda
```

### 🧠 Conceito Teórico / Por trás dos panos
**A tela é uma função do estado.** Pense em `tela = Componente(estado)`. Toda vez que você chama um `set...` (ex.: `setTasks`), o React:
1. **Agenda** uma nova renderização do componente (não é na hora: várias mudanças seguidas viram uma só).
2. **Roda o componente de novo** e obtém a nova árvore de elementos (o "DOM virtual", só objetos JavaScript).
3. **Compara** com a árvore anterior (*reconciliação*) e descobre a menor lista de mudanças.
4. **Aplica só essas mudanças** no DOM de verdade.
5. **Roda os efeitos** (`useEffect`) cujas dependências mudaram.

**Por que `key` importa.** Na lista de cartões, se você usar a posição (0, 1, 2) como `key` e mover uma tarefa, o React acha que "o cartão 0 mudou de texto" em vez de "este cartão saiu daqui". Com `key={task.id}`, ele sabe exatamente qual cartão é qual.

**Estado imutável.** Nunca altere o estado "por dentro" (`tasks.push(nova)`): o React compara referências e não perceberia a mudança. Crie uma cópia nova:
```tsx
setTasks((atual) => [nova, ...atual]);                                    // adiciona
setTasks((atual) => atual.map((t) => (t.id === id ? { ...t, status } : t))); // altera um
setTasks((atual) => atual.filter((t) => t.id !== id));                    // remove
```
A forma com função (`(atual) => ...`) usa sempre o valor mais recente, mesmo se várias atualizações acontecerem juntas.

**Efeitos não são para tudo.** `useEffect` serve para sincronizar com algo **de fora** do React (rede, `localStorage`, APIs do navegador como `dialog.showModal()`). Calcular algo a partir do estado não precisa de efeito: é só uma conta no corpo do componente (ou `useMemo`). O lint do projeto acusa `setState` chamado de forma síncrona dentro de efeito, porque isso causa uma renderização extra. Nós corrigimos isso no quadro (ver Armadilhas).

**React 19.3 e `use(browser())`.** Algumas telas do FlowMind dependem do `localStorage`, que só existe no navegador. `use(browser("motivo"))` avisa ao React: "esta parte só renderiza no navegador". No servidor ela **suspende**, e o `<Suspense>` em volta mostra o *fallback*. Detalhes na aula de Next.js.

### 🛠️ Comandos e Operação
```bash
cd apps/web              # o React mora no front
npm run dev              # sobe em http://localhost:3001 e recarrega a cada arquivo salvo
npm run lint             # ESLint com as regras de hooks do React (pega efeito mal usado, dependência faltando)
npx tsc --noEmit         # confere os tipos das props sem gerar arquivos
npm ls react react-dom   # mostra a versão do React instalada (19.3.0)
```
Extensão útil: **React Developer Tools** (Chrome/Edge). Ela mostra a árvore de componentes, as props e o estado de cada um.

### 🧪 Experimente você mesmo
Vamos criar um componente com estado e vê-lo reagir.

1. **Suba tudo:** Docker, API (`cd apps/api && npm run start:dev`) e front (`cd apps/web && npm run dev`). Entre em `http://localhost:3001` e crie uma conta.
2. **Crie** `apps/web/src/components/contador.tsx`:
   ```tsx
   "use client";                                   // tem estado e clique: roda no navegador
   import { useState } from "react";

   export function Contador() {
     const [cliques, setCliques] = useState(0);     // estado começa em 0
     return (
       <button onClick={() => setCliques((c) => c + 1)} className="rounded border px-2">
         Cliquei {cliques} {cliques === 1 ? "vez" : "vezes"}
       </button>
     );
   }
   ```
3. **Use-o** em `src/components/board/task-board.tsx`: importe (`import { Contador } from "@/components/contador";`) e coloque `<Contador />` logo depois do `<h1>Tarefas</h1>`. Salve.
   Esperado: o botão aparece; cada clique muda o número **sem recarregar a página**.
4. **Veja o "props":** troque para `<Contador />` duas vezes seguidas. Esperado: dois botões, **cada um com seu próprio estado**. Componente é planta; cada uso é uma obra independente.
5. **Quebre de propósito:** troque `setCliques((c) => c + 1)` por `cliques++`. Esperado: erro de lint/TypeScript (`cliques` é `const`) e, mesmo forçando, a tela não atualizaria, porque só o `set...` avisa o React.
6. **Desfaça:** remova o `<Contador />` e o import do `task-board.tsx` e apague `contador.tsx`. Confira com `git status` que não sobrou nada.

### ⚠️ Armadilhas Comuns
- **Mudar o estado direto** (`tasks.push(x)`, `task.status = "DONE"`). Sintoma: a tela não atualiza. Correção: crie um array/objeto novo com `map`, `filter` ou `...`.
- **Esquecer a `key` em listas.** Sintoma: aviso `Each child in a list should have a unique "key" prop`. Correção: `key={item.id}` (não use o índice se a lista muda de ordem).
- **`useEffect` sem lista de dependências** (`useEffect(fn)`): roda depois de **toda** renderização e pode entrar em loop infinito com `setState`. Correção: liste as dependências (`[reloadKey]`).
- **`setState` síncrono dentro do efeito.** Sintoma no nosso lint: `Calling setState synchronously within an effect can trigger cascading renders`. Correção: só chamar `set...` depois do `await`/`.then`, ou mover a lógica para o evento (como o botão "Tentar de novo" faz).
- **Resposta atrasada sobrescrevendo dados.** Se o componente sai da tela antes da API responder, a resposta chega "no vazio". Correção: a flag `ignore` na limpeza do efeito.
- **Hooks dentro de `if` ou laço.** Sintoma: `React Hook "useState" is called conditionally`. Os hooks precisam ser chamados sempre na mesma ordem: deixe-os no topo do componente.

### 🤔 Por que usamos / Quando usar
- **Interfaces interativas** (quadro de tarefas, formulários, diálogos) ficam muito mais simples de manter.
- **Componentes reaproveitáveis**: o mesmo `TaskCard` aparece em três colunas e na cópia que segue o mouse.
- **Maior ecossistema do mercado** de front-end: Next.js, React Native (apps de celular), milhares de bibliotecas (dnd-kit, Zustand, Lucide).

Alternativas: **Vue** e **Svelte** resolvem o mesmo problema com sintaxes diferentes (e às vezes menos código). **Angular** é um framework completo, mais comum em empresas grandes. Para uma página simples e quase sem interação, HTML + um pouco de JavaScript puro basta.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do prédio, o que são componente, props, estado e o próprio React?</summary>

Componente = planta reaproveitável. Props = as medidas de cada uso. Estado = a situação atual da obra. React = o mestre de obras, que compara e refaz só o que mudou.
</details>

<details><summary>2. Por que <code>tasks.push(nova)</code> não atualiza a tela?</summary>

Porque o React só renderiza de novo quando você chama o `set...` com um valor **novo**. Alterar o array por dentro mantém a mesma referência e não avisa o React. O certo é `setTasks((atual) => [nova, ...atual])`.
</details>

<details><summary>3. Para que serve a <code>key</code> numa lista de cartões?</summary>

Para o React saber qual cartão é qual entre uma renderização e outra, mesmo que a ordem mude. Usamos o `id` da tarefa.
</details>

<details><summary>4. Quando usar <code>useEffect</code>?</summary>

Para sincronizar com algo de fora do React: buscar dados na API, ler o `localStorage`, abrir um `<dialog>`. Cálculos a partir do estado não precisam de efeito.
</details>

<details><summary>5. O que a função retornada pelo <code>useEffect</code> do quadro faz?</summary>

É a limpeza: roda quando o quadro sai da tela (ou antes do efeito rodar de novo) e marca `ignore = true`, para uma resposta atrasada da API não alterar um componente que já não está lá.
</details>
