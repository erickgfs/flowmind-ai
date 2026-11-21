# 🎓 Aula: Prisma ORM (do zero)
> **Categoria:** `databases` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 7 de 7 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/L6T5h6kfEkHdXwCK5MkGFT) · arquivo local [`prisma.html`](./prisma.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 2: [PostgreSQL](../postgresql/postgresql.md)**: tabelas, colunas, chave primária, chave estrangeira e SQL.
- **Aula 5: [Node.js, npm e TypeScript](../../backend/nodejs/nodejs.md)**: pacotes, `async`/`await` e tipos.
- **Aula 6: [NestJS](../../backend/nestjs/nestjs.md)**: o `PrismaService` é um provider do Nest.

### 🎯 O que é e qual problema resolve
**O problema.** A API fala TypeScript; o banco fala SQL. Sem ajuda, você escreveria SQL dentro de textos:
```ts
const r = await db.query("SELECT * FROM taks WHERE user_id = $1", [id]); // "taks": erro só aparece rodando
```
- Erro de digitação no nome da tabela ou coluna só aparece quando o código roda.
- O resultado não tem tipo: o editor não sabe que uma tarefa tem `title`.
- Criar e alterar tabelas na mão, em cada computador e no servidor, sai do controle: "na minha máquina a coluna existe".

**A solução.** O **Prisma** é um **ORM** (*Object-Relational Mapper*): uma camada que traduz entre objetos do TypeScript e tabelas do banco. Ele tem três peças:
1. **Schema** (`schema.prisma`): você descreve as tabelas num arquivo simples, numa linguagem própria.
2. **Migrate**: compara o schema com o banco e gera o SQL para criar ou alterar as tabelas, guardando cada mudança num arquivo versionado (a *migration*).
3. **Client**: código TypeScript **gerado a partir do schema**, com autocompletar e tipos: `prisma.task.findMany({ where: { userId } })`.

**Analogia: a planta do prédio.**
- O **schema** é a **planta do arquiteto**: diz quais cômodos (tabelas) existem e o que tem em cada um.
- A **migration** é a **ordem de obra** datada: "dia 19/10, construir os cômodos users e tasks". A obra fica registrada; ninguém refaz o que já foi feito.
- O **Prisma Client** é o **interfone com a lista de moradores**: você só consegue chamar cômodos que existem na planta; se digitar errado, o interfone já avisa.

*Onde a analogia falha:* um prédio raramente muda de planta. O schema muda o tempo todo; cada mudança vira uma nova migration.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **ORM** | Camada que traduz entre objetos do código e tabelas do banco. |
| **Schema Prisma** | Arquivo `schema.prisma` que descreve modelos, campos e relações. |
| **Model** | Bloco do schema que vira uma tabela (`model Task`). |
| **Campo** | Linha de um model que vira uma coluna (`title String`). |
| **Atributo** | Instrução com `@` num campo (`@id`, `@unique`, `@default`) ou com `@@` no model (`@@map`, `@@index`). |
| **Enum** | Lista fechada de valores permitidos (`TODO`, `IN_PROGRESS`, `DONE`). |
| **Relação 1:N** | Um registro ligado a vários outros: um usuário tem várias tarefas. |
| **onDelete: Cascade** | Ao apagar o "pai" (usuário), o banco apaga os "filhos" (tarefas). |
| **UUID** | Identificador aleatório de 36 caracteres, difícil de adivinhar (ex: `3f2b...`). |
| **Migration** | Arquivo SQL datado com uma mudança no banco, guardado no Git. |
| **Prisma Client** | Código gerado com métodos tipados para consultar o banco. |
| **generate** | Comando que (re)cria o Prisma Client a partir do schema. |
| **Driver adapter** | Peça que conecta o Prisma ao banco usando um driver Node (aqui, `pg`). Obrigatório no Prisma 7. |
| **prisma.config.ts** | Configuração do Prisma CLI: onde está o schema, as migrations e a URL do banco. |
| **DATABASE_URL** | Endereço completo do banco: `postgresql://usuario:senha@host:porta/banco`. |
| **Prisma Studio** | Tela no navegador para ver e editar os dados das tabelas. |

### 🏗️ Como funciona no nosso projeto
```
apps/api/
├── prisma.config.ts              config do CLI: lê o .env e aponta schema + migrations
├── .env                          DATABASE_URL (montada com o usuário/senha do .env da raiz)
├── prisma/
│   ├── schema.prisma             a planta: models User e Task
│   └── migrations/
│       └── 20261019183605_init/
│           └── migration.sql     a ordem de obra que criou as tabelas
└── src/
    ├── generated/prisma/         Prisma Client gerado (fora do Git, recriado no npm install)
    └── prisma/prisma.service.ts  o Client como provider do Nest (aula 6)
```

O schema atual:
```prisma
enum TaskStatus   { TODO  IN_PROGRESS  DONE }
enum TaskPriority { LOW  MEDIUM  HIGH }

model User {
  id           String   @id @default(uuid()) @db.Uuid   // chave primária, UUID gerado sozinho
  email        String   @unique                          // não aceita dois e-mails iguais
  name         String
  passwordHash String   @map("password_hash")          // nunca guardamos a senha pura (Fase de login)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")   // Prisma atualiza a cada alteração
  tasks        Task[]                                    // lado "N" da relação (não vira coluna)
  @@map("users")                                         // nome da tabela no banco
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  title       String
  description String?                                    // ? = opcional (aceita NULL)
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?    @map("due_date")
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  userId      String       @map("user_id") @db.Uuid      // a chave estrangeira (coluna real)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])                                       // acelera "tarefas do usuário X"
  @@map("tasks")
}
```

**Convenção de nomes:** no TypeScript usamos `camelCase` (`createdAt`); no banco, `snake_case` (`created_at`). O `@map`/`@@map` faz a tradução. Tabelas no plural (`users`), models no singular (`User`).

### 🧠 Conceito Teórico / Por trás dos panos
**O ciclo do Prisma.**
1. Você edita o `schema.prisma`.
2. `prisma migrate dev` compara o schema com o banco, escreve o SQL da diferença em `prisma/migrations/<data>_<nome>/migration.sql`, aplica no banco e anota na tabela `_prisma_migrations` que aquela migration já rodou.
3. Em seguida ele roda `prisma generate`, que lê o schema e escreve o Client em `src/generated/prisma`.
4. A API usa o Client. Cada chamada (`prisma.task.findMany(...)`) vira SQL, vai ao PostgreSQL pelo driver adapter `pg` e volta como objeto tipado.

**O SQL que o Prisma gerou para nós** (trecho real da migration `init`):
```sql
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "user_id" UUID NOT NULL,
    ...
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```
Tudo o que você aprendeu na aula de PostgreSQL (PK, FK, índice) está aí; o Prisma só escreveu por você.

**O que mudou no Prisma 7.** Versões antigas tinham um "motor" separado escrito em Rust. No Prisma 7, a conexão é feita por um **driver adapter** em JavaScript. Por isso instalamos `@prisma/adapter-pg` + `pg`, e o `PrismaService` cria `new PrismaPg({ connectionString })`. Outras mudanças: a URL do banco saiu do `schema.prisma` e foi para o `prisma.config.ts`, e o `.env` não é mais lido automaticamente (daí o `import 'dotenv/config'`).

**Por que o Client gerado fica fora do Git?** Ele é 100% derivado do schema. Guardar os dois seria duplicar. O script `postinstall` regenera o Client sempre que alguém roda `npm install`.

### 🛠️ Comandos e Operação
Dentro de `apps/api`, com o PostgreSQL rodando (`docker compose up -d` na raiz):
```bash
npm run prisma:migrate -- --name add_tags   # cria e aplica uma migration chamada "add_tags"
npm run prisma:generate                     # regenera o Client (após mudar o schema sem migrar)
npm run prisma:studio                       # abre o Prisma Studio no navegador (http://localhost:5555)

npx prisma validate          # confere se o schema está correto
npx prisma format                                   # alinha e formata o schema.prisma
npx prisma migrate status    # lista migrations aplicadas e pendentes
npx prisma migrate deploy    # aplica migrations pendentes (usado em produção)

docker exec -it flowmind-postgres psql -U flowmind -d flowmind -c '\d tasks'  # ver a tabela real
```
> O CLI acha o `prisma.config.ts` sozinho na pasta `apps/api`. Se existir mais de um arquivo de config (ex: um `prisma7.config.ts` esquecido), ele pode carregar o errado: a primeira linha da saída, `Loaded Prisma config from ...`, mostra qual foi usado.

### 🧪 Experimente você mesmo
Vamos criar um usuário e duas tarefas pelo Prisma Studio, e ver o `onDelete: Cascade` funcionando.

1. **Abra o Studio.**
   ```bash
   cd apps/api
   npm run prisma:studio
   ```
   Esperado: abre `http://localhost:5555` com os models `User` e `Task`.

2. **Crie um usuário.** Em `User` → *Add record*: `email = teste@flowmind.dev`, `name = Teste`, `passwordHash = x`. Salve (*Save 1 change*). Repare que `id`, `createdAt` e `updatedAt` foram preenchidos sozinhos.

3. **Crie duas tarefas** em `Task`, escolhendo o usuário criado no campo `user`. Não preencha `status`. Esperado: `status = TODO` e `priority = MEDIUM` (os `@default`).

4. **Tente quebrar uma regra.** Crie outro usuário com o mesmo e-mail. Esperado: erro `Unique constraint failed on the fields: (email)`.

5. **Veja o cascade.** Apague o usuário `teste@flowmind.dev`. Abra `Task`. Esperado: as duas tarefas sumiram junto.

6. **Desfaça:** não sobrou nada (o cascade já limpou). Feche o Studio com `Ctrl+C` no terminal.

### ⚠️ Armadilhas Comuns
- **Mudar o schema e esquecer de migrar.** Sintoma: `The column "x" does not exist in the current database`. Correção: `npm run prisma:migrate -- --name <nome>`.
- **Editar uma migration que já foi aplicada.** O Prisma detecta a diferença (*checksum*) e pede para resetar o banco, apagando os dados. Nunca edite: crie uma nova migration.
- **`Cannot find module '../generated/prisma/client.js'`.** O Client não foi gerado (ex: após clonar o repositório). Correção: `npm install` ou `npm run prisma:generate`.
- **Versões diferentes de `prisma` e `@prisma/client`.** Sintoma: avisos de incompatibilidade ou erros estranhos. Mantenha as duas iguais (hoje, `7.10.1`).
- **Senha com caracteres especiais na `DATABASE_URL`.** `@`, `#`, `/` na senha quebram a URL. Eles precisam ser codificados (`@` vira `%40`).
- **`prisma migrate reset` "para resolver".** Apaga **todos** os dados do banco. Só em desenvolvimento e sabendo o que perde.
- **`prisma init` cria arquivos extras.** Na Fase 2 ele também baixou "skills" de agentes de IA (`.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json`), que puxavam para o Prisma 8, e criou um `prisma7.config.ts` que o CLI carregava no lugar do `prisma.config.ts`. Sintoma: suas mudanças no config são ignoradas. Correção: apagamos esses arquivos. Revise o que um comando de *init* cria antes de fazer commit.

### 🤔 Por que usamos / Quando usar
- **Tipos de ponta a ponta:** o schema gera tipos TypeScript; errar o nome de um campo é erro no editor, não em produção.
- **Migrations versionadas no Git:** qualquer pessoa (ou o servidor) recria o banco igual com `migrate deploy`.
- **Schema legível:** o `schema.prisma` funciona como documentação viva do banco.
- **Prisma Studio** ajuda muito a visualizar dados enquanto se aprende.

Quando outra opção é melhor: consultas SQL muito complexas (relatórios pesados) → SQL puro via `prisma.$queryRaw` ou **Kysely**. Preferência por escrever algo próximo do SQL → **Drizzle**. Estilo com classes e decorators no Nest → **TypeORM**.

### ✅ Teste seu entendimento
<details><summary>1. Quais são as três peças do Prisma e o que cada uma faz?</summary>

Schema (descreve as tabelas), Migrate (gera e aplica o SQL das mudanças, guardando em migrations) e Client (código TypeScript tipado para consultar o banco).
</details>

<details><summary>2. O campo <code>tasks Task[]</code> do model User vira uma coluna?</summary>

Não. Ele só existe no Prisma, para navegar de um usuário para suas tarefas. A coluna real é `user_id` na tabela `tasks`.
</details>

<details><summary>3. O que acontece com as tarefas quando um usuário é apagado? Por quê?</summary>

São apagadas junto, por causa do `onDelete: Cascade` na relação, que virou `ON DELETE CASCADE` na chave estrangeira.
</details>

<details><summary>4. Para que servem <code>@map</code> e <code>@@map</code>?</summary>

Para usar nomes diferentes no código e no banco: `createdAt` no TypeScript vira a coluna `created_at`; o model `User` vira a tabela `users`.
</details>

<details><summary>5. Por que o Prisma 7 precisa do pacote <code>@prisma/adapter-pg</code>?</summary>

Porque no Prisma 7 a conexão com o banco é feita por um driver adapter em JavaScript. Para PostgreSQL, o adapter usa o driver `pg`.
</details>
