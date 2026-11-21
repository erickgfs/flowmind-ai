# 🎓 Aula: PostgreSQL (do zero)
> **Categoria:** `databases` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 2 de 7 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/UWCbwypxyhJNmoc58iiuZL) · arquivo local [`postgresql.html`](./postgresql.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 1: [Docker](../../devops-infra/docker/docker.md)**, porque nosso PostgreSQL roda dentro de um container.
- **Cliente e servidor:** um *servidor* é um programa que fica ligado esperando pedidos. Um *cliente* é quem faz os pedidos. Quando você abre um site, o navegador é o cliente e o site é o servidor. Com bancos de dados é igual: o PostgreSQL é o servidor; o terminal `psql` e, futuramente, a API do FlowMind são clientes.

### 🎯 O que é e qual problema resolve
**O problema.** O FlowMind vai guardar usuários, projetos, tarefas e documentos. Onde guardar isso? Um arquivo de texto ou uma planilha parecem suficientes, até que:
- duas pessoas editam a mesma tarefa ao mesmo tempo e uma alteração apaga a outra;
- você precisa achar *uma* tarefa no meio de um milhão de linhas, em milissegundos;
- o programa trava no meio do salvamento e o arquivo fica corrompido pela metade;
- alguém cria uma tarefa ligada a um projeto que não existe.

**A solução.** Um **banco de dados** é um programa especializado em guardar informações de forma organizada e segura, e encontrá-las depois rapidamente. O **PostgreSQL** (ou "Postgres") é um dos bancos mais usados do mundo, gratuito e de código aberto. Ele guarda os dados em **tabelas** (parecidas com planilhas), garante regras que você define e responde perguntas escritas numa linguagem chamada **SQL**.

**Analogia: a biblioteca com bibliotecário.**
- Os livros ficam no **depósito** (o disco). Você não entra no depósito.
- Você faz o pedido ao **bibliotecário** (o servidor PostgreSQL), numa língua que ele entende (o **SQL**): "me traga todas as tarefas pendentes do projeto 1".
- Ele sabe onde tudo está (graças aos **índices**, como o índice remissivo de um livro) e traz só o que você pediu.
- Ele também aplica as **regras da casa**: não aceita cadastrar um livro sem estante, nem dois livros com o mesmo código.
- Se dois leitores pedem para alterar o mesmo cadastro ao mesmo tempo, ele atende um de cada vez, sem bagunça.

*Onde a analogia falha:* o bibliotecário de verdade atende uma pessoa por vez. O PostgreSQL atende muitos clientes em paralelo.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Banco de dados** | Conjunto organizado de dados guardados de forma permanente. |
| **SGBD** | "Sistema Gerenciador de Banco de Dados": o programa que cuida do banco. O PostgreSQL é um SGBD. |
| **Relacional** | Tipo de banco que guarda dados em tabelas que se relacionam entre si. |
| **Tabela** | Estrutura com colunas fixas e várias linhas, como uma aba de planilha com regras. |
| **Linha (registro)** | Um item da tabela, como *uma* tarefa. |
| **Coluna** | Um atributo com tipo definido, como `titulo` (texto) ou `criada_em` (data). |
| **Tipo de dado** | O que uma coluna aceita: `integer` (número inteiro), `text` (texto), `boolean` (verdadeiro/falso), `timestamp` (data e hora). |
| **NULL** | "Sem valor". Diferente de zero ou texto vazio. |
| **Chave primária (PK)** | Coluna que identifica cada linha de forma única, normalmente `id`. |
| **Chave estrangeira (FK)** | Coluna que aponta para a chave primária de outra tabela. É ela que cria a relação. |
| **SQL** | A linguagem para criar tabelas, inserir, buscar, alterar e apagar dados. |
| **Consulta (query)** | Um comando SQL, normalmente uma pergunta como `SELECT ...`. |
| **psql** | O cliente de terminal oficial do PostgreSQL. |
| **Transação** | Grupo de comandos que acontece por inteiro ou não acontece. |
| **Índice** | Estrutura auxiliar que acelera buscas, como o índice remissivo de um livro. |
| **JSONB** | Tipo de coluna que guarda um JSON (dado flexível) de forma pesquisável. |
| **pgvector** | Extensão que guarda "vetores", usados por IA para buscar textos pelo significado. |

### 🏗️ Como funciona no nosso projeto
- **Onde roda:** no container `flowmind-postgres`, imagem `postgres:16-alpine`, porta `5432`.
- **O que já existe:** um banco chamado `flowmind` e um usuário `flowmind`, com a senha no arquivo `.env`. Ainda **não há tabelas**. Elas serão criadas na Fase 2, pela API.
- **Onde os dados ficam:** na pasta `/var/lib/postgresql/data` do container, que é o volume `postgres_data`. Por isso os dados sobrevivem quando o container é recriado.
- **O que vai guardar:** um exemplo de como devem ficar as tabelas principais (os nomes finais serão definidos na Fase 2):

  | Tabela | Guarda | Liga com |
  |---|---|---|
  | `usuarios` | quem usa o sistema | — |
  | `projetos` | os projetos de cada usuário | `usuarios` (dono) |
  | `tarefas` | os cards estilo Jira | `projetos` |
  | `documentos` | as páginas estilo Notion | `projetos` |

### 🧠 Conceito Teórico / Por trás dos panos
**Relações.** Em vez de repetir o nome do projeto em cada tarefa, a tarefa guarda só o `id` do projeto (a chave estrangeira `projeto_id`). Se o projeto mudar de nome, muda em um lugar só. O banco recusa uma tarefa com `projeto_id = 99` se o projeto 99 não existir. Isso se chama **integridade referencial**.

**Transações e ACID.** Imagine mover 5 tarefas de um projeto para outro. Se a luz cair depois de mover 3, você quer que nada tenha mudado, e não um estado pela metade. Uma transação garante isso:
- **A**tomicidade: tudo ou nada.
- **C**onsistência: as regras (PK, FK, NOT NULL) valem sempre.
- **I**solamento: quem está lendo não vê o trabalho pela metade de outra pessoa.
- **D**urabilidade: depois do "salvo" (`COMMIT`), nem queda de energia apaga.

**Como ele não perde dados: o WAL.** Antes de alterar os arquivos da tabela, o PostgreSQL anota a alteração num diário chamado *Write-Ahead Log*. Se o computador desligar no meio, ao voltar ele relê o diário e termina ou desfaz o que estava pendente.

**Índices.** Sem índice, achar uma tarefa por `id` exige olhar linha por linha. Com índice (a chave primária ganha um automaticamente), o banco vai direto ao lugar, como o índice remissivo de um livro.

### 🛠️ Comandos e Operação
Entrar no banco pelo terminal do VS Code:
```bash
docker exec -it flowmind-postgres psql -U flowmind -d flowmind
#  docker exec -it     roda um comando dentro do container, de forma interativa
#  psql                o cliente do PostgreSQL
#  -U flowmind         usuário
#  -d flowmind         banco de dados
```

Dentro do `psql`, comandos que começam com `\` são do próprio psql (não são SQL):
```
\l           lista os bancos
\dt          lista as tabelas do banco atual
\d tarefas   mostra as colunas da tabela "tarefas"
\?           ajuda
\q           sai
```

SQL básico (o famoso CRUD: Create, Read, Update, Delete):
```sql
-- CREATE: criar uma tabela
CREATE TABLE tarefas (
  id        serial PRIMARY KEY,         -- número automático e único
  titulo    text NOT NULL,              -- texto obrigatório
  status    text DEFAULT 'pendente',    -- se não informar, vira 'pendente'
  criada_em timestamp DEFAULT now()     -- data/hora do momento da criação
);

-- CREATE: inserir linhas
INSERT INTO tarefas (titulo) VALUES ('Configurar Docker');

-- READ: buscar
SELECT * FROM tarefas;                         -- todas as colunas, todas as linhas
SELECT titulo FROM tarefas WHERE status = 'pendente';

-- UPDATE: alterar (SEMPRE com WHERE)
UPDATE tarefas SET status = 'feita' WHERE id = 1;

-- DELETE: apagar (SEMPRE com WHERE)
DELETE FROM tarefas WHERE id = 1;
```

### 🧪 Experimente você mesmo
Vamos criar uma tabela de teste, brincar com ela e apagá-la no final. Nada aqui afeta o projeto.

1. **Entre no banco.**
   ```bash
   docker exec -it flowmind-postgres psql -U flowmind -d flowmind
   ```
   Esperado: o prompt muda para `flowmind=#`.

2. **Confirme que ainda não há tabelas.**
   ```
   \dt
   ```
   Esperado: `Did not find any relations.` (nenhuma tabela).

3. **Crie a tabela de teste.**
   ```sql
   CREATE TABLE tarefas_teste (
     id serial PRIMARY KEY,
     titulo text NOT NULL,
     status text DEFAULT 'pendente'
   );
   ```
   Esperado: `CREATE TABLE`.

4. **Insira três tarefas.**
   ```sql
   INSERT INTO tarefas_teste (titulo) VALUES
     ('Subir o PostgreSQL'),
     ('Subir o Redis'),
     ('Criar a API');
   ```
   Esperado: `INSERT 0 3` (3 linhas inseridas).

5. **Busque, filtre e altere.**
   ```sql
   SELECT * FROM tarefas_teste;
   UPDATE tarefas_teste SET status = 'feita' WHERE id IN (1, 2);
   SELECT titulo, status FROM tarefas_teste WHERE status = 'pendente';
   ```
   Esperado no último: só a linha `Criar a API | pendente`.

6. **Veja uma regra funcionando.**
   ```sql
   INSERT INTO tarefas_teste (status) VALUES ('feita');
   ```
   Esperado: erro `null value in column "titulo" ... violates not-null constraint`. O banco recusou uma tarefa sem título.

7. **Desfaça e saia.**
   ```sql
   DROP TABLE tarefas_teste;   -- apaga a tabela de teste inteira
   \q
   ```

### ⚠️ Armadilhas Comuns
- **Esquecer o `;` no final.** Sintoma: nada acontece e o prompt vira `flowmind-#`. O psql está esperando o fim do comando. Digite `;` e Enter.
- **`UPDATE` ou `DELETE` sem `WHERE`.** Altera ou apaga *todas* as linhas da tabela. Escreva o `WHERE` primeiro e teste com um `SELECT` usando o mesmo filtro.
- **Aspas trocadas.** Texto usa aspas simples: `'pendente'`. Aspas duplas são para nomes de tabelas e colunas.
- **Maiúsculas em nomes.** `CREATE TABLE Tarefas` vira `tarefas`. Use nomes em minúsculas com `_`.
- **Trocar a senha no `.env` depois que o banco já foi criado.** A senha antiga continua valendo. Para trocar: `ALTER USER flowmind PASSWORD 'nova';`.
- **Outro PostgreSQL instalado no Windows na porta 5432.** Sintoma: erro de senha mesmo com a senha certa, porque você está falando com o outro banco. Mude `POSTGRES_PORT` no `.env`.

### 🤔 Por que usamos / Quando usar
- Dados com **estrutura e relações** (usuário → projeto → tarefa) são o ponto forte de um banco relacional.
- O PostgreSQL é gratuito, muito estável e padrão de mercado: aparece em vagas de backend e full stack.
- **JSONB** permite guardar os blocos de conteúdo dos documentos (estilo Notion), que têm formato variado, sem perder as relações.
- **pgvector** permite, numa fase futura, a busca por significado com IA ("ache documentos parecidos com este") no mesmo banco.

Quando outra opção é melhor: dados guardados temporariamente para responder rápido → **Redis** (aula 3). App pequeno que roda num único dispositivo, sem servidor → **SQLite**. Grandes volumes de documentos sem estrutura fixa e sem relações → **MongoDB**.

### ✅ Teste seu entendimento
<details><summary>1. Qual a diferença entre chave primária e chave estrangeira?</summary>

A chave primária identifica cada linha da própria tabela (o `id` da tarefa). A chave estrangeira é uma coluna que aponta para a chave primária de *outra* tabela (o `projeto_id` da tarefa aponta para `projetos.id`).
</details>

<details><summary>2. O que acontece se você rodar <code>DELETE FROM tarefas;</code>?</summary>

Apaga todas as tarefas, porque não há `WHERE` para filtrar quais.
</details>

<details><summary>3. Por que uma transação é importante ao mover várias tarefas de projeto?</summary>

Porque ela garante "tudo ou nada". Se algo falhar no meio, nenhuma tarefa é movida, e o banco não fica num estado pela metade.
</details>

<details><summary>4. No FlowMind, quem é o servidor e quem é o cliente?</summary>

O servidor é o PostgreSQL no container `flowmind-postgres`. Os clientes são o `psql` no terminal e, a partir da Fase 2, a API do FlowMind.
</details>

## 🚀 Evolução Prática (Projeto: flowmind-ai) - As primeiras tabelas reais: UUID, ENUM e ON DELETE CASCADE
Na Fase 2 o banco ganhou tabelas de verdade, criadas pelo Prisma (veja a [aula 7: Prisma](../prisma/prisma.md)). Os nomes finais ficaram em inglês e no plural: `users` e `tasks`. A tabela `projetos` do exemplo acima ainda não existe; por enquanto cada tarefa pertence direto a um usuário.

```
\dt
 public | _prisma_migrations | table | flowmind   ← controle do Prisma: quais migrations já rodaram
 public | tasks              | table | flowmind
 public | users              | table | flowmind
```

Três recursos do PostgreSQL apareceram pela primeira vez:

| Recurso | Onde | O que faz |
|---|---|---|
| **`UUID`** | `users.id`, `tasks.id`, `tasks.user_id` | Identificador aleatório de 36 caracteres (`3f2b9c1e-...`) no lugar do `serial` (1, 2, 3...). Ninguém consegue adivinhar o próximo id trocando um número na URL. |
| **`ENUM`** (`CREATE TYPE ... AS ENUM`) | `tasks.status`, `tasks.priority` | Um tipo novo que só aceita valores de uma lista: `TODO`, `IN_PROGRESS`, `DONE`. Valor fora da lista = erro. |
| **`ON DELETE CASCADE`** | FK `tasks.user_id → users.id` | Apagar um usuário apaga automaticamente as tarefas dele, sem deixar tarefas "órfãs". |

Veja a tabela real:
```bash
docker exec -it flowmind-postgres psql -U flowmind -d flowmind -c '\d tasks'
#  -c '\d tasks'   roda um único comando do psql e sai: mostra colunas, índices e FKs de "tasks"
```
Esperado, no fim da saída: `"tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE`.

<details><summary>Por que UUID em vez de serial para o id?</summary>

Com `serial`, os ids são 1, 2, 3... e qualquer pessoa adivinha o próximo (`/tasks/4`). O UUID é aleatório, então não revela quantos registros existem nem facilita adivinhar ids alheios.
</details>
