# 🎓 Aula: Node.js, npm e TypeScript (do zero)
> **Categoria:** `backend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 5 de 7 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/Djj7iRD33FgYNkut3YWGZK) · arquivo local [`nodejs.html`](./nodejs.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 2: [PostgreSQL](../../databases/postgresql/postgresql.md)**, para entender a ideia de *cliente e servidor*. A API que vamos criar é um servidor para o navegador e, ao mesmo tempo, um cliente do banco.
- **JavaScript em uma frase:** é a linguagem de programação que roda dentro dos navegadores. Ela tem variáveis (`const nome = 'Ana'`), funções (`function soma(a, b) { return a + b }`) e objetos (`{ titulo: 'Estudar', feita: false }`). Você não precisa dominar JavaScript para seguir esta aula.

### 🎯 O que é e qual problema resolve
**O problema.** O FlowMind precisa de um programa que fique ligado no servidor, receba pedidos do navegador ("crie esta tarefa", "liste minhas tarefas"), converse com o PostgreSQL e devolva respostas. JavaScript, porém, nasceu para rodar *dentro* do navegador. Fora dele, não havia onde executá-lo. Além disso:
- todo projeto reaproveita código de outras pessoas (bibliotecas). Copiar arquivos na mão vira bagunça;
- JavaScript aceita `tarefa.titlo` (erro de digitação) e só descobre o erro quando o programa já está rodando.

**A solução tem três peças:**
1. **Node.js** é um programa que executa JavaScript fora do navegador: no seu computador ou num servidor.
2. **npm** é o gerenciador de pacotes que vem com o Node. Ele baixa bibliotecas e anota quais versões o projeto usa.
3. **TypeScript** é JavaScript com *tipos*: você diz que `titulo` é um texto, e o editor aponta o erro de digitação antes de rodar.

**Analogia: a cozinha profissional.**
- O **Node.js** é o fogão: sem ele a receita (o código) é só papel.
- O **npm** é o fornecedor de ingredientes prontos. O `package.json` é a **lista de compras** e o `package-lock.json` é a **nota fiscal** com a marca e o lote exatos de cada item.
- A pasta `node_modules` é a **despensa** onde os ingredientes ficam guardados.
- O **TypeScript** é o chef revisor que lê a receita antes de cozinhar e diz "aqui está escrito 200 kg de sal, deve ser 200 g".

*Onde a analogia falha:* ingredientes acabam; pacotes do npm não. Qualquer projeto baixa a mesma biblioteca quantas vezes quiser.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Runtime** | Programa que executa código de uma linguagem. O Node.js é um runtime de JavaScript. |
| **Pacote (biblioteca)** | Código pronto, feito por outra pessoa, que você instala e reutiliza. |
| **npm** | Gerenciador de pacotes do Node: instala, atualiza e remove pacotes. |
| **npx** | Executa um comando de um pacote sem instalá-lo de forma global. |
| **package.json** | Ficha do projeto: nome, scripts e lista de pacotes com faixa de versões aceitas. |
| **package-lock.json** | Registro das versões *exatas* instaladas, para todo mundo instalar igual. |
| **node_modules** | Pasta onde o npm guarda os pacotes. Nunca vai para o Git. |
| **dependencies** | Pacotes que o programa usa enquanto roda (ex: o Prisma Client). |
| **devDependencies** | Pacotes usados só no desenvolvimento (ex: o compilador TypeScript, o Vitest). |
| **Script npm** | Atalho com nome, definido no `package.json`, rodado com `npm run <nome>`. |
| **Versão semântica (semver)** | Formato `MAIOR.MENOR.CORREÇÃO`. `^7.10.1` aceita `7.x.x`, nunca `8`. |
| **dist-tag** | Apelido de uma versão no npm. `latest` deveria ser a estável, mas nem sempre é. |
| **RC (release candidate)** | Versão "quase pronta", ainda em teste. Evite em projetos reais. |
| **TypeScript** | JavaScript com tipos, verificados antes de rodar. |
| **Compilar (transpilar)** | Traduzir `.ts` para `.js`, que é o que o Node executa. |
| **ESM (ES Modules)** | Sistema moderno de `import`/`export`. Exige a extensão `.js` nos imports locais. |
| **Monorepo** | Um único repositório com vários projetos dentro (API, site, bibliotecas). |
| **Variável de ambiente** | Configuração passada ao programa por fora do código (ex: a senha do banco). |
| **.env** | Arquivo de texto com variáveis de ambiente. Nunca vai para o Git. |

### 🏗️ Como funciona no nosso projeto
Na Fase 2 o FlowMind virou um **monorepo**:

```
flowmind-ai/
├── apps/              ← programas que rodam
│   └── api/           ← a API (Node.js + NestJS), aula 6
│       ├── package.json        lista de compras da API
│       ├── package-lock.json   nota fiscal (versões exatas)
│       ├── node_modules/       despensa (fora do Git)
│       ├── tsconfig.json       regras do revisor TypeScript
│       ├── .env                DATABASE_URL e PORT (fora do Git)
│       ├── .env.example        modelo do .env, sem senha real
│       ├── prisma/             schema do banco, aula 7
│       └── src/                código TypeScript da API
├── packages/          ← código compartilhado (futuro: tipos usados pela API e pelo site)
├── docker-compose.yml ← PostgreSQL e Redis, aula 4
└── .env               ← senhas do Docker Compose
```

- `apps/` vai receber depois o `web` (frontend) e talvez um `worker` (tarefas em segundo plano).
- `packages/` está vazio por enquanto (tem só um `.gitkeep`, um arquivo vazio para o Git não ignorar a pasta).
- A API usa **Node.js 24**, **TypeScript 6** e **ESM** (`"type": "module"` no `package.json`). Por isso o código importa `./app.module.js`, com `.js`, mesmo o arquivo sendo `.ts`.

Scripts que o `apps/api/package.json` oferece:

| Script | O que faz |
|---|---|
| `npm run start:dev` | Sobe a API e reinicia sozinha a cada arquivo salvo |
| `npm run build` | Compila o TypeScript para a pasta `dist/` |
| `npm run start:prod` | Roda a versão compilada |
| `npm test` | Roda os testes (Vitest) |
| `npm run lint` | Procura problemas no código (oxlint) |
| `npm run prisma:migrate` | Aplica mudanças do schema no banco (aula 7) |

### 🧠 Conceito Teórico / Por trás dos panos
**Um garçom só, muito rápido: o event loop.** O Node executa seu código em **uma única linha de execução**. Parece pouco, mas quase todo o tempo de uma API é *esperar* (o banco responder, o disco ler). Em vez de ficar parado esperando, o Node anota "quando o banco responder, continue daqui" e vai atender o próximo pedido. Esse mecanismo é o **event loop**. É por isso que você verá `async`/`await` no código: `await` significa "espere este resultado sem travar os outros pedidos".

```ts
async function contarTarefas() {
  const total = await prisma.task.count(); // o Node atende outros pedidos enquanto o banco conta
  return total;
}
```

**Como o npm escolhe versões.** No `package.json` está `"@prisma/client": "^7.10.1"`. O `^` aceita qualquer `7.x.x` igual ou maior. O `npm install` escolhe a melhor versão dentro da faixa e grava a escolhida no `package-lock.json`. Na próxima instalação (sua ou de outra pessoa), o lock garante a mesma versão.

**Do TypeScript ao JavaScript.** O Node 24 até consegue ler TypeScript simples, mas o NestJS usa recursos (decorators) que precisam de compilação. O `npm run build` lê `src/**/*.ts`, confere os tipos e escreve `dist/**/*.js`. Erro de tipo = build falha, antes de chegar ao usuário.

### 🛠️ Comandos e Operação
```bash
node -v                        # versão do Node instalada (no projeto: v24)
npm -v                         # versão do npm

cd apps/api                    # entra na pasta da API (todos os comandos npm abaixo rodam aqui)
npm install                    # instala tudo que está no package.json/package-lock.json
npm install pg                 # adiciona um pacote em "dependencies"
npm install -D @types/pg       # -D = adiciona em "devDependencies"
npm install prisma@7.10.1      # @versão = instala exatamente essa versão
npm uninstall pg               # remove um pacote

npm view prisma dist-tags      # mostra os apelidos (latest, next...) e a versão de cada um
npm ls @prisma/client          # mostra qual versão está instalada de fato
npm outdated                   # lista pacotes com versão mais nova disponível

npm run build                  # roda o script "build" do package.json
npx tsc --noEmit               # só confere os tipos, sem gerar arquivos
```

### 🧪 Experimente você mesmo
Vamos provocar um erro de tipo de propósito e ver o TypeScript pegá-lo antes de rodar.

1. **Crie um arquivo de teste** `apps/api/src/teste-tipos.ts`:
   ```ts
   type Tarefa = { titulo: string; feita: boolean };

   const t: Tarefa = { titulo: 'Estudar Node', feita: false };
   console.log(t.titlo); // erro de digitação proposital
   ```

2. **Peça ao TypeScript para conferir.**
   ```bash
   cd apps/api
   npx tsc --noEmit
   ```
   Esperado: `error TS2551: Property 'titlo' does not exist on type 'Tarefa'. Did you mean 'titulo'?`

3. **Corrija** `t.titlo` para `t.titulo` e rode de novo. Esperado: nenhuma saída (nenhum erro).

4. **Veja a versão semântica na prática.**
   ```bash
   npm view prisma dist-tags
   ```
   Esperado: uma lista em que `latest` aponta para uma versão com `-rc` no nome. Repare que "latest" nem sempre é estável.

5. **Desfaça:** apague o arquivo `src/teste-tipos.ts`.

### ⚠️ Armadilhas Comuns
- **Confiar cegamente em `@latest`.** Na Fase 2, `npm install prisma@latest` instalou `8.0.0-rc.23` (uma versão de teste), enquanto o `@prisma/client` ficou em `7.10.1`. CLI e client de versões diferentes quebram. Correção: rode `npm view <pacote> dist-tags`, escolha a estável e fixe a mesma versão nos pacotes irmãos (`prisma@7.10.1` e `@prisma/client@7.10.1`).
- **Esquecer o `.js` no import (ESM).** Sintoma: `ERR_MODULE_NOT_FOUND ... Did you mean to import "./app.module.js"?`. Correção: em projetos `"type": "module"`, imports locais terminam em `.js`.
- **Rodar `npm` na pasta errada.** Sintoma: `npm error enoent Could not read package.json`. Correção: `cd apps/api` antes.
- **Subir `node_modules` ou `.env` para o Git.** São pesados ou secretos. Os dois estão no `.gitignore`.
- **Apagar o `package-lock.json` "para resolver".** Faz cada máquina instalar versões diferentes. Só apague se souber o motivo.

### 🤔 Por que usamos / Quando usar
- **Uma linguagem só** no backend e no frontend (React, numa fase futura): menos troca de contexto e tipos compartilhados via `packages/`.
- **Ótimo para APIs**: o event loop atende muitos pedidos que passam a maior parte do tempo esperando banco e rede.
- **TypeScript** é padrão de mercado em vagas Node e evita uma classe inteira de bugs.
- **Monorepo** facilita mudar API e site no mesmo commit e compartilhar código.

Quando outra opção é melhor: cálculo pesado de CPU (processar vídeo, treinar modelo de IA) → **Python** ou **Go**. Projeto com um único programa pequeno → um repositório simples, sem `apps/`.

### ✅ Teste seu entendimento
<details><summary>1. Qual a diferença entre <code>package.json</code> e <code>package-lock.json</code>?</summary>

O `package.json` diz quais pacotes e qual *faixa* de versões o projeto aceita (`^7.10.1`). O `package-lock.json` registra a versão *exata* instalada, para todo mundo ter o mesmo resultado.
</details>

<details><summary>2. Por que o Prisma CLI vai em devDependencies e o Prisma Client em dependencies?</summary>

O CLI só é usado no desenvolvimento (criar migrations, gerar código). O Client é usado pela API enquanto ela roda, inclusive em produção.
</details>

<details><summary>3. O que o <code>await</code> faz com os outros pedidos que chegam à API?</summary>

Nada de ruim: enquanto aquele pedido espera o banco, o event loop do Node continua atendendo os outros.
</details>

<details><summary>4. Por que fixamos <code>prisma@7.10.1</code> em vez de usar <code>@latest</code>?</summary>

Porque `latest` apontava para uma versão de teste (RC 8.0.0) e ficaria diferente do `@prisma/client` 7.10.1. Pacotes que trabalham juntos precisam da mesma versão.
</details>

<details><summary>5. Para que servem as pastas <code>apps/</code> e <code>packages/</code>?</summary>

`apps/` guarda os programas que rodam (a API hoje, o site depois). `packages/` guarda código compartilhado entre eles.
</details>
