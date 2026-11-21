# 🎓 Aula: Arrastar e soltar acessível com dnd-kit
> **Categoria:** `frontend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 16 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/AdioC3HFjhZjEBwqRn5ZJC) · arquivo local [`dnd-kit.html`](./dnd-kit.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 12: [React](../react/react.md)**: componentes, estado, hooks e a regra do estado imutável.
- **Aula 6: [NestJS](../../backend/nestjs/nestjs.md)** (seção de evolução): a rota `PATCH /tasks/:id`, que salva o novo status.
- **Acessibilidade (em poucas linhas):** fazer o site funcionar para todo mundo, inclusive quem usa **só o teclado** (Tab para andar, Enter/Espaço para agir) ou um **leitor de tela** (programa que lê a página em voz alta para pessoas cegas, como o NVDA no Windows).

### 🎯 O que é e qual problema resolve
**O problema.** Num quadro de tarefas, a forma natural de mudar o status é **pegar o cartão e levar para outra coluna**. Fazer isso à mão é surpreendentemente difícil: acompanhar o mouse **e** o dedo no celular, desenhar uma cópia que segue o ponteiro, descobrir sobre qual coluna o cartão está, rolar a tela... E o pior costuma ficar esquecido: quem não usa mouse **não consegue arrastar nada**, e o leitor de tela não diz o que está acontecendo.

**A solução.** O **dnd-kit** é uma biblioteca de React que entrega as peças prontas: um contexto que coordena o arrastar, hooks para marcar o que é **arrastável** (os cartões) e onde dá para **soltar** (as colunas), sensores para mouse, toque **e teclado**, e anúncios para leitores de tela. Você decide o visual e o que acontece ao soltar.

**Analogia: o aeroporto.**
- O **`DndContext`** é a **torre de controle**: acompanha o voo do começo ao fim e avisa quando decola e pousa.
- Cada **cartão** (`useDraggable`) é um **avião**; cada **coluna** (`useDroppable`) é uma **pista**.
- Os **sensores** são as **formas de pilotar**: manche (mouse), tela de toque e piloto automático por teclas (teclado).
- A **detecção de colisão** é o **radar**: decide sobre qual pista o avião está.
- O **`DragOverlay`** é a **sombra do avião** que desliza pela pista: a cópia do cartão que segue o ponteiro, enquanto o original fica esmaecido no portão.
- Os **anúncios** são o **rádio**: "voo Estudar Next.js aproximando da pista Feito".

*Onde a analogia falha:* a torre não decide a pista de destino no aeroporto real, o piloto decide. No dnd-kit a torre só **avisa** (`onDragEnd`) onde o cartão foi solto; quem muda os dados (e chama a API) é o **nosso** código.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Drag and drop (arrastar e soltar)** | Pegar um elemento, mover e soltar em outro lugar. |
| **dnd-kit** | Biblioteca de arrastar e soltar para React, focada em acessibilidade e desempenho. |
| **`DndContext`** | Componente que coordena um arrastar e dispara os eventos (`onDragStart`, `onDragEnd`). |
| **Draggable (`useDraggable`)** | Elemento que pode ser arrastado (o cartão). |
| **Droppable (`useDroppable`)** | Área onde se pode soltar (a coluna). |
| **`active` / `over`** | O item sendo arrastado / a área sobre a qual ele está. |
| **Sensor** | Forma de iniciar e controlar o arrastar: ponteiro (mouse/toque) ou teclado. |
| **Activation constraint** | Condição para começar a arrastar; aqui, mover 4px, para um clique não virar arrastar. |
| **Detecção de colisão** | Regra que decide sobre qual área o item está (`pointerWithin`, `rectIntersection`). |
| **`DragOverlay`** | A cópia do item que acompanha o ponteiro, desenhada por cima de tudo. |
| **Atualização otimista** | Mudar a tela **antes** da API responder e desfazer se ela recusar. |
| **Rollback** | Desfazer a mudança otimista quando o servidor responde com erro. |
| **Leitor de tela** | Programa que lê a página em voz alta para pessoas cegas. |
| **Live region (`aria-live`)** | Trecho da página cujas mudanças o leitor de tela anuncia sozinho. |

### 🏗️ Como funciona no nosso projeto
Três arquivos em `apps/web/src/components/board/`:
```
task-board.tsx    DndContext: sensores, colisão, anúncios, onDragEnd (salva na API), DragOverlay
board-column.tsx  useDroppable({ id: status })  → cada coluna é uma pista; o id É o status
task-card.tsx     useDraggable({ id: task.id }) → cada cartão é um avião
```

**A coluna (pista).** Usar o próprio status como `id` deixa o `onDragEnd` simples:
```tsx
const { setNodeRef, isOver } = useDroppable({ id: status });   // "TODO" | "IN_PROGRESS" | "DONE"
<section className={isOver ? "border-accent bg-accent-soft" : "bg-subtle"}> ...  {/* destaque ao passar por cima */}
```

**O cartão (avião).**
```tsx
const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
<div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? "opacity-40" : ""}>
// attributes: role="button", tabIndex=0, aria-describedby (instruções para o leitor de tela)
// listeners: eventos de ponteiro e teclado que começam o arrastar
```

**A torre (`task-board.tsx`).**
```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),  // clique continua abrindo a tarefa
  useSensor(KeyboardSensor, {
    keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },  // Enter fica livre para abrir
    coordinateGetter: jumpBetweenColumns,                                      // setas pulam de coluna
  }),
);

async function handleDragEnd({ active, over }: DragEndEvent) {
  if (!over) return;                                    // soltou fora de qualquer coluna
  const task = tasks.find((t) => t.id === active.id);
  const newStatus = over.id as TaskStatus;
  if (!task || task.status === newStatus) return;

  setTasks(/* muda o status na tela AGORA (otimista) */);
  try {
    await api.updateTask(task.id, { status: newStatus });   // PATCH /tasks/:id
  } catch {
    setTasks(/* volta o status antigo (rollback) */);
    setActionError(`Não foi possível mover "${task.title}".`);
  }
}
```

**Como usar no teclado:** Tab até o cartão → **Espaço** pega → **setas** levam à coluna vizinha → **Espaço** solta (ou **Esc** cancela). **Enter** abre a tarefa.

### 🧠 Conceito Teórico / Por trás dos panos
**O ciclo de um arrastar.**
```
pointerdown no cartão ──(moveu 4px?)──► onDragStart ──► onDragMove/onDragOver (a cada movimento)
                                                         │  radar: qual coluna está "embaixo"?
                                                         ▼
                                   pointerup ──► onDragEnd({ active, over })  ou  Esc ──► onDragCancel
```
O dnd-kit **não muda a posição dos elementos no DOM** por conta própria: ele só calcula deslocamentos e avisa. A lista de tarefas continua sendo o **estado do React**; ao soltar, nós mudamos o estado, e o React redesenha o cartão na coluna nova.

**Detecção de colisão: duas estratégias combinadas.**
- `rectIntersection` (padrão): a coluna que mais se **sobrepõe** ao retângulo do cartão. No nosso teste, ao arrastar com o mouse, a coluna de **origem** continuava destacada enquanto o ponteiro já estava sobre "Feito", porque o retângulo do cartão ainda cobria mais a origem.
- `pointerWithin`: a coluna **sob o ponteiro**, que é o que a pessoa espera.
- Combinamos: se houver ponteiro, usa `pointerWithin`; no teclado (sem ponteiro), cai no `rectIntersection`.

**Teclado que pula de coluna.** O `KeyboardSensor` move o cartão 25px por tecla, e chegar à próxima coluna levaria umas 12 teclas. O nosso `coordinateGetter` recebe a posição de todas as colunas (`context.droppableRects`), descobre em qual o cartão está e devolve as coordenadas do **centro da coluna vizinha**. Ele ordena as colunas por linha e coluna, então funciona tanto com colunas lado a lado (computador) quanto empilhadas (celular).

**Por que `DragOverlay`.** Sem ele, o próprio cartão se moveria dentro da coluna e poderia ficar **cortado** pela borda dela. O overlay é desenhado por cima de tudo. O original fica esmaecido (`opacity-40`), marcando de onde saiu.

**Atualização otimista.** Esperar a API (de 50ms a 1s) para mover o cartão deixaria o quadro "travado". Mudamos a tela na hora e guardamos o status antigo para desfazer se a API recusar. O usuário vê o cartão voltar e uma mensagem de erro.

**Acessibilidade de verdade.** O dnd-kit cria uma *live region* escondida e anuncia cada etapa. Os textos padrão são em inglês. Nós passamos `announcements` em português e `screenReaderInstructions` explicando as teclas. No nosso teste automatizado, a região anunciou: *"Tarefa "Configurar Zustand" movida para A fazer."*

**O bug do Enter (achado no teste de ponta a ponta).** O Enter no cartão abria o diálogo, mas o `showModal()` do `<dialog>` coloca o foco no **primeiro botão** de dentro (o X de fechar), e o resto do mesmo Enter **apertava** esse botão, fechando o diálogo na hora. A correção foi `event.preventDefault()` no Enter do cartão, mais o foco levado explicitamente ao título. Lição: teste o teclado de verdade, não só o mouse.

### 🛠️ Comandos e Operação
```bash
cd apps/web
npm ls @dnd-kit/core        # versão instalada (6.3.x)
npm run dev                 # http://localhost:3001
```
Para testar acessibilidade no Windows: ative o **Narrador** (Ctrl + Win + Enter) ou instale o **NVDA** (gratuito), navegue até um cartão com Tab e use Espaço/setas. O leitor fala os anúncios em português.

### 🧪 Experimente você mesmo
1. **Suba** API e front e faça login. Crie três tarefas pelo botão "Nova tarefa".
2. **Mouse:** arraste uma tarefa de "A fazer" para "Feito". Esperado: a coluna sob o ponteiro fica destacada em índigo; ao soltar, o título fica riscado (concluída). Dê F5: continua em "Feito" (foi salvo na API).
3. **Clique × arrastar:** clique **sem mover** num cartão. Esperado: abre a edição, e não um arrastar (o `distance: 4`).
4. **Teclado:** clique fora dos cartões, aperte **Tab** até um cartão (aparece o contorno de foco), **Espaço**, **seta para a direita**, **Espaço**. Esperado: o cartão anda **uma coluna inteira**.
5. **Rollback na prática:** pare a API (Ctrl+C no terminal dela) e arraste um cartão. Esperado: o cartão muda de coluna, **volta** e aparece "Não foi possível mover … Não foi possível falar com a API". Suba a API de novo.
6. **Veja o anúncio:** F12 → Elements, procure por `aria-live`. Depois de mover pelo teclado, o texto dentro dela é o anúncio em português.
7. **Desfaça:** exclua as tarefas de teste (clique → Excluir → Confirmar exclusão).

### ⚠️ Armadilhas Comuns
- **Clique virou arrastar** (o diálogo não abre). Falta `activationConstraint: { distance: N }` no `PointerSensor`.
- **Coluna errada destacada** ao arrastar com mouse. A colisão padrão usa a área do cartão; combine com `pointerWithin`.
- **`over` é `null` no `onDragEnd`.** O cartão foi solto fora de qualquer área. Sempre trate (`if (!over) return`).
- **Cartão cortado ou "preso" dentro da coluna.** Use `<DragOverlay>` e não aplique `transform` no original.
- **Arrastar só funciona com mouse.** Sem `KeyboardSensor`, quem usa teclado fica de fora. E confira se as teclas de início não roubam o Enter que você usa para outra ação.
- **Esquecer o rollback.** Com atualização otimista, se a API falhar, a tela mente até o próximo F5.
- **Anúncios em inglês.** Passe `accessibility={{ announcements, screenReaderInstructions }}` traduzidos.
- **Rolagem da página com as setas** durante o arrastar pelo teclado. `event.preventDefault()` no `coordinateGetter`.

### 🤔 Por que usamos / Quando usar
- **Acessível de fábrica** (teclado e leitor de tela), o que bibliotecas mais antigas não oferecem.
- **Leve e modular**: só o `@dnd-kit/core` resolveu o quadro (ordenar dentro da coluna exigiria o `@dnd-kit/sortable`).
- **Não manda no seu estado**: o React continua sendo a fonte da verdade.

Alternativas: a **API nativa de HTML5** (`draggable`, `ondrop`) não funciona bem no toque nem no teclado; **react-beautiful-dnd** foi descontinuada; **pragmatic-drag-and-drop** (da Atlassian, criadora do Jira) é uma opção moderna, menos focada em React. Quando **não** usar arrastar: se a ação for rara ou precisar de precisão, um menu "Mover para…" é mais simples. No FlowMind há os dois: arrastar **e** o seletor de status no diálogo.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do aeroporto, o que são <code>DndContext</code>, <code>useDraggable</code>, <code>useDroppable</code> e <code>DragOverlay</code>?</summary>

A torre de controle, os aviões (cartões), as pistas (colunas) e a sombra do avião que desliza pela pista (a cópia que segue o ponteiro).
</details>

<details><summary>2. Por que o <code>id</code> de cada coluna é o próprio status?</summary>

Porque no `onDragEnd` o `over.id` já diz para qual status a tarefa deve ir, sem nenhuma conversão.
</details>

<details><summary>3. O que é a atualização otimista e qual o risco dela?</summary>

Mudar a tela antes da API responder, para o quadro não parecer travado. O risco é a API recusar, por isso guardamos o status antigo e fazemos rollback com uma mensagem de erro.
</details>

<details><summary>4. Por que usamos <code>pointerWithin</code> junto com <code>rectIntersection</code>?</summary>

`pointerWithin` escolhe a coluna sob o ponteiro (o que a pessoa espera no mouse). No teclado não há ponteiro, então caímos no `rectIntersection`, que usa a sobreposição do cartão.
</details>

<details><summary>5. Por que o Enter fechava o diálogo logo depois de abrir?</summary>

O `showModal()` focava o primeiro botão do diálogo (o X) e o resto do mesmo Enter acionava esse botão. A correção foi `preventDefault()` no Enter do cartão e foco explícito no campo de título.
</details>
