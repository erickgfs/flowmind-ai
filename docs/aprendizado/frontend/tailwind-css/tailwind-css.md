# 🎓 Aula: Tailwind CSS v4 e design tokens
> **Categoria:** `frontend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 14 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/2V76eJVMdrpgaBQLq3pYQk) · arquivo local [`tailwind-css.html`](./tailwind-css.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 12: [React](../react/react.md)**: as classes do Tailwind vão no atributo `className` dos componentes.
- **CSS em poucas linhas:** CSS é a linguagem que define a **aparência** do HTML. Uma regra tem um **seletor** (quem) e **propriedades** (como): `.botao { background: blue; padding: 8px; }`. Uma **classe** é um nome que você dá a elementos (`<button class="botao">`) para aplicar regras a eles.
- **Variável CSS:** um valor com nome, definido uma vez e reaproveitado: `--accent: #5b5bd6;` e depois `color: var(--accent);`.

### 🎯 O que é e qual problema resolve
**O problema.** No CSS tradicional, cada componente ganha um nome (`.task-card`, `.task-card__title--done`) e as regras ficam num arquivo separado. Com o tempo, ninguém sabe se pode apagar uma regra (algum lugar ainda usa?), os nomes se repetem, os arquivos crescem para sempre e cada pessoa escolhe um espaçamento diferente: 13px aqui, 15px ali. O visual vai ficando inconsistente.

**A solução.** O **Tailwind** traz milhares de classes pequenas e prontas, cada uma fazendo **uma coisa**: `p-3` (espaçamento interno de 12px), `rounded-card` (cantos arredondados), `text-muted` (cor de texto secundária). Você monta o visual **direto no componente**. Como as classes vêm de uma escala fixa, o design fica consistente. E o Tailwind gera no CSS final **só** as classes que você realmente usou.

**Analogia: peças de LEGO × massinha.**
- O CSS tradicional é **massinha**: você molda cada peça do zero, cada uma fica um pouquinho diferente, e sobras se acumulam na mesa.
- O Tailwind é **LEGO**: peças padronizadas (`p-3`, `gap-2`, `rounded-md`) que se encaixam. Você não inventa um tamanho novo: escolhe da caixa.
- Os **design tokens** são a **paleta de cores oficial da caixa**: no FlowMind, só existem as cores `surface`, `muted`, `accent`... e cada uma tem a versão clara e a escura.

*Onde a analogia falha:* no LEGO você não consegue criar uma peça nova. No Tailwind, quando precisa, dá para escrever um valor exato (`h-[37px]`) ou criar seus próprios tokens, como fizemos com as cores.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **CSS** | Linguagem que define a aparência dos elementos HTML. |
| **Classe utilitária** | Classe que faz uma única coisa, como `p-3` (padding) ou `flex`. |
| **Tailwind CSS** | Framework de CSS feito de classes utilitárias, gerado sob medida a partir do seu código. |
| **Design token** | Decisão de design com nome: uma cor, um raio, uma fonte (`--accent`). |
| **Variável CSS (`--nome`)** | Valor com nome, lido com `var(--nome)`, que pode mudar conforme o tema. |
| **`@theme`** | Bloco do Tailwind v4 que cria classes a partir de variáveis: `--color-surface` vira `bg-surface`, `text-surface`... |
| **`@theme inline`** | Variante que aponta para outra variável (`var(--surface)`), para o valor trocar junto com o tema. |
| **`prefers-color-scheme`** | Consulta CSS que diz se o sistema do usuário está em tema claro ou escuro. |
| **Variante** | Prefixo que aplica a classe só em certa situação: `hover:`, `md:` (tela média ou maior), `focus:`, `has-checked:`. |
| **Responsivo** | Layout que se adapta à largura da tela (celular × computador). |
| **Escala de espaçamento** | Os tamanhos permitidos: cada passo vale 4px (`p-1` = 4px, `p-3` = 12px, `h-18` = 72px). |
| **PostCSS / plugin** | Ferramenta que processa o CSS no build; o Tailwind roda como plugin dela (no Turbopack). |

### 🏗️ Como funciona no nosso projeto
**1) Os tokens** ficam em `apps/web/src/app/globals.css`. Cada cor existe **uma vez** como variável, e o tema escuro só troca os valores:
```css
@import "tailwindcss";            /* carrega o Tailwind v4 (não existe mais tailwind.config.js) */

:root {                           /* tema claro (padrão) */
  --surface: #ffffff;
  --muted: #6b6f7b;
  --accent: #5b5bd6;
}
@media (prefers-color-scheme: dark) {
  :root {                         /* sistema no escuro: mesmos nomes, outros valores */
    --surface: #16171b;
    --muted: #8a8f98;
    --accent: #7c7ff2;
  }
}

@theme inline {                   /* liga as variáveis às classes do Tailwind */
  --color-surface: var(--surface);   /* cria bg-surface, text-surface, border-surface... */
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --radius-card: 6px;                /* cria rounded-card */
}
```

**2) Os componentes só usam os nomes dos tokens.** Exemplo real do cartão (`components/board/task-card.tsx`):
```tsx
<div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3 hover:border-border-strong">
```
| Classe | Faz |
|---|---|
| `flex flex-col` | empilha os filhos na vertical |
| `gap-2` | 8px entre os filhos |
| `rounded-card` | cantos de 6px (token nosso) |
| `border border-border` | borda de 1px na cor do token `border` |
| `bg-surface` | fundo branco no claro, `#16171b` no escuro |
| `p-3` | 12px de espaçamento interno |
| `hover:border-border-strong` | borda mais forte ao passar o mouse |

Repare que **não existe nenhuma classe `dark:`** no projeto: como o componente usa `bg-surface` e a variável muda com o tema, o tema escuro funciona sozinho.

**3) Responsivo** (`components/app-shell.tsx`): no celular a barra fica no topo; a partir de `md` (768px) vira barra lateral.
```tsx
<aside className="flex flex-row border-b md:h-screen md:w-[232px] md:flex-col md:border-r md:border-b-0">
```

### 🧠 Conceito Teórico / Por trás dos panos
**Como o Tailwind sabe quais classes gerar.** No build, o plugin do Tailwind (aqui, `@tailwindcss/turbopack`) **lê os arquivos do projeto como texto** e procura nomes que parecem classes (`bg-surface`, `md:flex-col`). Ele gera CSS **só para essas**. Por isso o arquivo final é pequeno, mesmo com milhares de classes possíveis.

Consequência importante: a classe precisa aparecer **inteira** no código. `` `bg-priority-${p}` `` **não funciona**, porque o texto `bg-priority-high` nunca aparece escrito. Por isso o projeto usa um mapa:
```tsx
const PRIORITY_DOT = { HIGH: "bg-priority-high", MEDIUM: "bg-priority-medium", LOW: "bg-priority-low" };
```

**Tokens em duas camadas.** Nós separamos o **valor** (`--surface: #fff`, que muda com o tema) do **nome no Tailwind** (`--color-surface: var(--surface)`). O `@theme inline` faz a classe `bg-surface` gerar `background-color: var(--surface)` (em vez de copiar `#fff`). Assim, quando o sistema troca para escuro, só a variável muda e todas as telas acompanham.

**Opacidade em tokens.** `focus:ring-accent/25` gera a cor do token com 25% de opacidade (o Tailwind v4 usa a função CSS `color-mix`). `text-muted/60` deixa o texto "Documentos (em breve)" ainda mais apagado.

**Variantes modernas usadas no projeto.**
- `aria-[current=page]:bg-accent-soft`: estiliza o link da página atual a partir do atributo de acessibilidade, sem uma classe extra.
- `has-checked:bg-accent-soft`: no seletor de prioridade, o `<label>` muda quando o rádio **dentro** dele está marcado (seletor CSS `:has()`).
- `backdrop:bg-black/40`: escurece o fundo do `<dialog>` nativo.

### 🛠️ Comandos e Operação
```bash
cd apps/web
npm run dev                         # o Tailwind recompila o CSS a cada arquivo salvo
npm run build                       # gera o CSS final só com as classes usadas
npm ls tailwindcss                  # confere a versão (4.x)
```
- **Extensão do VS Code "Tailwind CSS IntelliSense"**: autocompleta as classes (inclusive `bg-surface` e os outros tokens) e mostra o CSS gerado ao passar o mouse.
- **DevTools do navegador** (F12 → Elements): clique num elemento e veja quais regras cada classe aplicou. Em *Rendering → Emulate CSS prefers-color-scheme* dá para testar o tema escuro sem mudar o Windows.

### 🧪 Experimente você mesmo
Vamos trocar a cor de destaque do FlowMind **num lugar só** e ver todas as telas mudarem.

1. **Suba o front** (`cd apps/web && npm run dev`) e abra `http://localhost:3001/login`.
2. **Mude o token:** em `src/app/globals.css`, no bloco `:root` (o claro), troque `--accent: #5b5bd6;` por `--accent: #0f9d76;` (um verde) e salve.
   Esperado: o botão "Entrar", o anel de foco dos campos e o logo ficam verdes, **sem tocar em nenhum componente**.
3. **Veja o tema escuro:** F12 → menu ⋮ → *More tools → Rendering* → *Emulate CSS media feature prefers-color-scheme: dark*. Esperado: o destaque volta a ser índigo (`#7c7ff2`), porque você só mudou o valor do tema claro.
4. **Prove a regra das classes inteiras:** em `components/board/task-icons.tsx`, no `PriorityBadge`, acrescente ao `<span>` de fora uma cor montada com variável:
   ```tsx
   <span className={`inline-flex items-center gap-1.5 text-[12px] text-priority-${priority.toLowerCase()}`}>
   ```
   Crie tarefas com as três prioridades. Esperado: **só "Média" fica amarela**; "Alta" e "Baixa" ficam na cor normal do texto, sem o vermelho e o cinza esperados. Por quê? `text-priority-medium` aparece escrita por inteiro em outro lugar do código (no ícone de status "Fazendo"), então o Tailwind a gerou. `text-priority-high` e `text-priority-low` nunca aparecem escritas, então não existem no CSS.
5. **Desfaça:** volte as duas alterações (`git checkout -- src/app/globals.css src/components/board/task-icons.tsx`) e confira com `git status`.

### ⚠️ Armadilhas Comuns
- **Classe montada com variável** (`` `bg-${cor}-500` ``). Sintoma: o estilo simplesmente não aparece. Correção: escreva a classe inteira num mapa ou num `if`.
- **Seguir tutorial do Tailwind v3 no v4.** No v4 não existe `tailwind.config.js` por padrão nem `@tailwind base;`. A configuração vive no CSS (`@import "tailwindcss"` + `@theme`).
- **Cor "solta" no componente** (`bg-[#ffffff]` ou `bg-white`). Funciona, mas quebra o tema escuro e foge da paleta. Use os tokens (`bg-surface`).
- **Classes conflitantes** (`p-2 p-4` no mesmo elemento). Quem vence depende da ordem no CSS gerado, não da ordem no atributo. Use uma só.
- **`className` enorme e ilegível.** Quando um padrão se repete muito, extraia um **componente** React (como fizemos com `PriorityBadge` e `TextField`), não uma classe CSS nova.
- **Remover o contorno de foco** (`outline-none`) sem colocar outro indicador. Quem usa teclado se perde. No projeto, todo `outline-none` vem com `focus:ring-...` ou borda de foco.

### 🤔 Por que usamos / Quando usar
- **Consistência**: espaçamentos, raios e cores vêm de escalas e tokens, não de valores inventados na hora.
- **Velocidade**: estiliza sem trocar de arquivo nem inventar nomes de classe.
- **CSS final pequeno** e sem regras "mortas".
- **Tema claro/escuro barato** com tokens em variáveis CSS.
- Padrão de mercado, usado pelo shadcn/ui e pelos exemplos oficiais do Next.

Alternativas: **CSS Modules** (CSS tradicional com nomes isolados por componente; bom para quem prefere CSS puro), **styled-components/Emotion** (CSS dentro do JavaScript; perdeu espaço com os Server Components), **bibliotecas prontas** como MUI e Chakra (componentes já estilizados, menos liberdade visual).

### ✅ Teste seu entendimento
<details><summary>1. Por que o projeto não tem nenhuma classe <code>dark:</code>?</summary>

Porque os componentes usam tokens (`bg-surface`, `text-muted`) que apontam para variáveis CSS, e é a variável que muda de valor quando o sistema está no escuro. Todos os componentes acompanham sozinhos.
</details>

<details><summary>2. O que o <code>@theme inline</code> faz com <code>--color-surface: var(--surface)</code>?</summary>

Cria as classes `bg-surface`, `text-surface`, `border-surface`... que leem a variável `--surface` em vez de copiar um valor fixo, por isso respeitam o tema.
</details>

<details><summary>3. Por que <code>`bg-priority-${p}`</code> não funciona?</summary>

O Tailwind gera o CSS lendo o código como texto e procurando classes escritas por inteiro. Uma classe montada em tempo de execução nunca aparece escrita, então o CSS dela não é gerado.
</details>

<details><summary>4. O que significa <code>md:flex-col</code>?</summary>

Aplica `flex-direction: column` só em telas de 768px ou mais. No celular vale a classe sem prefixo (`flex-row`).
</details>

<details><summary>5. Quero trocar a cor de destaque do produto inteiro. Onde mexo?</summary>

Num lugar só: o valor de `--accent` (e do `--accent-hover`) no `globals.css`, uma vez para o tema claro e outra para o escuro.
</details>
