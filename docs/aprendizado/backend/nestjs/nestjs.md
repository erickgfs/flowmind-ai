# 🎓 Aula: NestJS (do zero)
> **Categoria:** `backend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 6 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/Geb9ZgxQax9DtnMzji9SnG) · arquivo local [`nestjs.html`](./nestjs.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 5: [Node.js, npm e TypeScript](../nodejs/nodejs.md)**. O NestJS roda em cima do Node e é escrito em TypeScript.
- **O que é uma API (em poucas linhas):** é um programa que fica ligado esperando **pedidos** pela rede e devolve **respostas**. Cada pedido tem um **método** (o verbo: `GET` = buscar, `POST` = criar, `PATCH` = alterar, `DELETE` = apagar) e uma **rota** (o endereço: `/tasks`). Exemplo: `GET http://localhost:3000/tasks` = "me dê a lista de tarefas". O formato da resposta costuma ser **JSON**: `{ "titulo": "Estudar", "feita": false }`.

### 🎯 O que é e qual problema resolve
**O problema.** Dá para escrever uma API em Node puro, mas o projeto cresce: rotas de usuários, tarefas, documentos, login, IA... Sem uma organização definida, cada arquivo faz de tudo, um muda e outro quebra, e cada desenvolvedor organiza de um jeito. Além disso, todo arquivo precisa "montar" sozinho as peças de que depende (a conexão com o banco, a configuração), repetindo código.

**A solução.** O **NestJS** é um *framework*: uma estrutura pronta que diz **onde cada coisa fica** e **monta as peças para você**. Ele divide a API em três papéis:
- **Controller** recebe o pedido HTTP e devolve a resposta. Não tem regra de negócio.
- **Service (provider)** faz o trabalho de verdade: regras, cálculos, acesso ao banco.
- **Module** agrupa controllers e services de um mesmo assunto (ex: tudo de "tarefas").

E ele tem um **injetor de dependências**: você só declara "este service precisa do banco" e o Nest entrega o banco pronto.

**Analogia: o restaurante.**
- O **controller** é o **garçom**: anota o pedido na mesa e leva o prato. Ele não cozinha.
- O **service** é o **cozinheiro**: sabe a receita e prepara o prato.
- O **module** é uma **praça da cozinha** (confeitaria, grelhados): reúne garçons e cozinheiros de um mesmo cardápio.
- A **injeção de dependências** é o **gerente**: o cozinheiro não sai para comprar a panela; ele diz "preciso de uma panela" e o gerente entrega. Todos usam a mesma panela compartilhada (uma única instância).

*Onde a analogia falha:* num restaurante cada garçom atende uma mesa por vez. No Nest, o mesmo controller atende milhares de pedidos ao mesmo tempo, graças ao event loop do Node (aula 5).

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Framework** | Estrutura pronta que define como organizar e montar o programa. |
| **API / HTTP** | Programa que responde pedidos pela rede; HTTP é o "idioma" desses pedidos. |
| **Rota** | Endereço + método de um pedido, como `GET /tasks`. |
| **JSON** | Formato de texto para dados: `{ "chave": "valor" }`. |
| **Controller** | Classe que recebe pedidos HTTP de certas rotas e devolve respostas. |
| **Service / Provider** | Classe com a lógica de negócio, que o Nest pode injetar em outras. |
| **Module** | Classe que agrupa controllers e providers de um assunto. |
| **Decorator** | Etiqueta com `@` acima de uma classe ou método que dá instruções ao Nest (`@Get()`, `@Module()`). |
| **Injeção de dependências (DI)** | O Nest cria as peças e entrega a quem pediu no `constructor`. |
| **Singleton** | Uma única instância compartilhada por toda a aplicação. |
| **Lifecycle hook** | Método que o Nest chama num momento certo, como `onModuleInit` (ao iniciar). |
| **@Global()** | Torna um módulo visível em todos os outros sem precisar importá-lo em cada um. |
| **ConfigModule** | Módulo oficial (`@nestjs/config`) que lê o `.env` e entrega as variáveis via `ConfigService`. |
| **Nest CLI** | Ferramenta de terminal `nest` que cria projetos e arquivos (`nest new`, `nest g`). |
| **Vitest** | Ferramenta de testes automatizados que vem configurada no projeto. |
| **oxlint** | "Linter": procura erros e más práticas no código sem rodá-lo. |

### 🏗️ Como funciona no nosso projeto
A API foi criada com o Nest CLI (versão 12) em `apps/api`:

```
apps/api/src/
├── main.ts              ponto de partida: cria a aplicação e liga na porta 3000
├── app.module.ts        módulo raiz: importa ConfigModule e PrismaModule
├── app.controller.ts    rota GET / → "Hello World!" (veio do modelo do Nest)
├── app.service.ts       lógica usada pelo AppController
├── prisma/
│   ├── prisma.module.ts   módulo GLOBAL que oferece o banco
│   └── prisma.service.ts  PrismaService: o "Prisma Client" como provider do Nest
└── generated/prisma/    código gerado pelo Prisma (fora do Git, aula 7)
```

O `AppModule` liga as peças:
```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lê apps/api/.env e libera o ConfigService para todos
    PrismaModule,                              // libera o PrismaService para todos
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

O `PrismaService` é a ponte entre o Nest e o banco:
```ts
@Injectable()                                   // "o Nest pode criar e injetar esta classe"
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {          // DI: o Nest entrega o ConfigService pronto
    const adapter = new PrismaPg({ connectionString: config.getOrThrow('DATABASE_URL') });
    super({ adapter });                         // cria o Prisma Client com essa conexão
  }
  async onModuleInit() { await this.$connect(); }     // ao subir a API: conecta
  async onModuleDestroy() { await this.$disconnect(); } // ao desligar: desconecta
}
```

Na Fase 3, um futuro `TasksService` só vai precisar escrever `constructor(private prisma: PrismaService) {}` para ter acesso às tarefas.

### 🧠 Conceito Teórico / Por trás dos panos
**O caminho de um pedido.**
1. O navegador manda `GET /`.
2. O Nest (usando o Express por baixo) procura qual controller tem `@Get()` naquela rota → `AppController.getHello()`.
3. O controller chama o service (`this.appService.getHello()`).
4. O service faz o trabalho (no futuro, consulta o banco via `PrismaService`).
5. O retorno vira a resposta HTTP. Se for um objeto, o Nest transforma em JSON sozinho.

**Como a injeção de dependências funciona.** Ao iniciar, o Nest lê os decorators de todos os módulos e monta um **mapa de dependências**: "o `PrismaService` precisa do `ConfigService`". Ele cria primeiro quem não depende de ninguém, depois quem depende desses, e guarda **uma instância de cada** (singleton). Por isso o log de inicialização mostra `ConfigModule dependencies initialized`, `PrismaModule dependencies initialized`. Se faltar uma peça, a API nem sobe e o erro diz qual: `Nest can't resolve dependencies of the X (?)`.

**Por que separar controller e service?** O controller fala "HTTP"; o service fala "negócio". Assim o mesmo service pode ser usado por uma rota HTTP, por uma tarefa agendada ou por um teste, sem mudar nada.

### 🛠️ Comandos e Operação
Todos rodam dentro de `apps/api` (`cd apps/api`), com o Docker rodando o PostgreSQL:
```bash
npm run start:dev              # sobe a API em modo desenvolvimento e reinicia a cada arquivo salvo
curl http://localhost:3000     # faz um pedido GET / pelo terminal → Hello World!
npm run build                  # compila para dist/
npm run start:prod             # roda a versão compilada (como em produção)
npm test                       # roda os testes com Vitest
npm run lint                   # procura problemas no código com oxlint

npx nest generate module tasks       # cria src/tasks/tasks.module.ts e registra no AppModule
npx nest generate controller tasks   # cria o controller de tarefas
npx nest generate service tasks      # cria o service de tarefas
# atalho: npx nest g resource tasks   cria module + controller + service + DTOs de uma vez
```

### 🧪 Experimente você mesmo
Vamos criar uma rota que conta usuários e tarefas no banco, usando o `PrismaService` injetado.

1. **Suba o banco e a API.**
   ```bash
   docker compose up -d          # na raiz flowmind-ai/
   cd apps/api
   npm run start:dev
   ```
   Esperado: no fim do log, `Nest application successfully started`.

2. **Edite** `src/app.controller.ts` e adicione a rota (mantenha o que já existe):
   ```ts
   import { PrismaService } from './prisma/prisma.service.js';

   // no constructor, acrescente o PrismaService:
   constructor(
     private readonly appService: AppService,
     private readonly prisma: PrismaService, // o Nest injeta sozinho, porque o PrismaModule é global
   ) {}

   @Get('stats')                              // rota GET /stats
   async stats() {
     return {
       users: await this.prisma.user.count(), // SELECT COUNT(*) FROM users
       tasks: await this.prisma.task.count(),
     };
   }
   ```

3. **Teste no navegador** abrindo `http://localhost:3000/stats`. Esperado: `{"users":0,"tasks":0}`.

4. **Veja o erro de DI.** Tire temporariamente o `PrismaModule` dos `imports` do `app.module.ts` e salve. Esperado: `Nest can't resolve dependencies of the AppController (AppService, ?)`. Coloque de volta.

5. **Desfaça:** remova a rota `stats` e o `PrismaService` do constructor (ou mantenha, se quiser usá-la).

### ⚠️ Armadilhas Comuns
- **Regra de negócio no controller.** Funciona, mas espalha lógica e dificulta testes. Controller só recebe e repassa.
- **`Nest can't resolve dependencies of the X (?)`.** A peça pedida no `constructor` não está em nenhum módulo acessível. Correção: importe o módulo que a exporta, ou marque-o com `@Global()` (como fizemos com o `PrismaModule`).
- **Esquecer o `@Injectable()`** no service. Sintoma: o mesmo erro de dependência. Toda classe injetável precisa dele.
- **Criar o `PrismaClient` com `new` em vários lugares.** Cada um abre suas próprias conexões e o banco pode recusar novas. Use sempre o `PrismaService` injetado.
- **`Error: listen EADDRINUSE: address already in use :::3000`.** Já tem uma API rodando (talvez em outro terminal). Feche-a ou mude `PORT` no `apps/api/.env`.
- **`DATABASE_URL` undefined.** O `ConfigModule.forRoot()` lê o `.env` da pasta de onde a API foi iniciada. Rode os comandos dentro de `apps/api`.

### 🤔 Por que usamos / Quando usar
- **Estrutura padronizada** (módulos por assunto) que aguenta o crescimento do FlowMind: users, tasks, docs, auth, IA.
- **Injeção de dependências** facilita testes: no teste, você entrega um banco falso no lugar do `PrismaService`.
- Vem com **testes, lint e build configurados**.
- Muito pedido em vagas Node/TypeScript; o estilo (módulos, DI, decorators) se parece com Spring (Java) e Angular, então o conhecimento transfere.

Quando outra opção é melhor: uma API minúscula com 2 ou 3 rotas → **Express** ou **Fastify** puros, com menos cerimônia. Funções serverless isoladas → o Nest é pesado demais.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do restaurante, quem é o controller, o service e o module?</summary>

Controller = garçom (recebe o pedido e entrega a resposta). Service = cozinheiro (faz o trabalho). Module = praça da cozinha (agrupa quem trabalha no mesmo assunto).
</details>

<details><summary>2. O que acontece quando você escreve <code>constructor(private prisma: PrismaService)</code>?</summary>

Você pede ao Nest uma instância do `PrismaService`. O injetor de dependências entrega a mesma instância compartilhada (singleton), já conectada ao banco.
</details>

<details><summary>3. Por que o <code>PrismaModule</code> tem <code>@Global()</code>?</summary>

Porque quase todo módulo do FlowMind vai precisar do banco. Com `@Global()`, basta importá-lo uma vez no `AppModule` e ele fica disponível em todos.
</details>

<details><summary>4. Para que servem <code>onModuleInit</code> e <code>onModuleDestroy</code> no PrismaService?</summary>

São *lifecycle hooks*: o Nest chama o primeiro quando a API sobe (conectamos ao banco) e o segundo quando ela desliga (fechamos as conexões).
</details>

---

## 🚀 Evolução Prática (Projeto: flowmind-ai) - CRUD REST protegido e o caminho completo de um pedido

> Fase 3 do FlowMind. Novos conceitos do Nest: **Guards**, **Pipes**, **decorators de parâmetro**, **códigos de status** e **módulos que exportam peças**. Aulas de apoio: [8 · Validação com DTOs](../class-validator/class-validator.md) e [9 · Autenticação com JWT e bcrypt](../jwt-bcrypt/jwt-bcrypt.md).

### O problema
Até a Fase 2, a API tinha só `GET /` → `Hello World!`. Agora precisamos de rotas para **criar, listar, ler, alterar e apagar tarefas** (o famoso **CRUD**: *Create, Read, Update, Delete*). E cada rota tem que responder três perguntas antes de tocar no banco: **quem é você?** (Guard), **o que você mandou está no formato certo?** (Pipe) e **essa tarefa é sua?** (service).

**Analogia, continuando o restaurante:** antes do garçom (controller) anotar o pedido, o **segurança da porta** (Guard) confere se você tem reserva, e a **recepcionista** (Pipe) confere se o pedido está legível e só tem pratos do cardápio. Só então o garçom anota. *Onde falha:* no restaurante, quem passou pela porta fica lá dentro; na API, o segurança confere **cada pedido** de novo, porque HTTP não tem memória.

### Glossário novo
| Termo | Em uma frase |
|---|---|
| **CRUD** | As quatro operações básicas sobre um recurso: criar, ler, atualizar, apagar. |
| **REST** | Estilo de API em que cada recurso tem um endereço (`/tasks`, `/tasks/:id`) e o verbo HTTP diz a ação. |
| **Parâmetro de rota** | Parte variável da URL, como o `:id` em `/tasks/:id`. |
| **Guard** | Peça que roda antes do controller e decide se o pedido entra (`@UseGuards`). |
| **Pipe** | Peça que valida/converte uma entrada antes do controller (`ValidationPipe`, `ParseUUIDPipe`). |
| **Decorator de parâmetro** | Decorator que entrega um pedaço do pedido ao método (`@Body()`, `@Param()`, `@CurrentUser()`). |
| **`@HttpCode()`** | Troca o status padrão da resposta (ex.: `204` no DELETE). |
| **Exceção HTTP** | Classe do Nest que vira uma resposta de erro: `NotFoundException` → `404`. |
| **exports** | Lista do módulo com as peças que outros módulos podem usar ao importá-lo. |

### As rotas de `/tasks` (`apps/api/src/tasks/`)
| Método e rota | Faz | Sucesso | Erros possíveis |
|---|---|---|---|
| `POST /tasks` | cria tarefa do usuário logado | `201 Created` | `400` body inválido, `401` sem token |
| `GET /tasks` | lista as tarefas do usuário (mais novas primeiro) | `200 OK` | `401` |
| `GET /tasks/:id` | lê uma tarefa | `200 OK` | `400` id não é UUID, `401`, `404` não existe ou é de outro usuário |
| `PATCH /tasks/:id` | altera só os campos enviados | `200 OK` | `400`, `401`, `404` |
| `DELETE /tasks/:id` | apaga | `204 No Content` | `400`, `401`, `404` |

O Nest já usa `201` para `@Post()` e `200` para o resto. Mudamos com `@HttpCode(HttpStatus.NO_CONTENT)` no DELETE (sucesso sem corpo) e `@HttpCode(HttpStatus.OK)` no `POST /auth/login` (login não cria recurso).

### O caminho completo de um pedido (atualizado)
```
PATCH /tasks/2b1c...   Authorization: Bearer eyJ...   body: {"status":"DONE"}
   │
   ▼  1. Roteador     acha TasksController.update (@Patch(':id'))
   ▼  2. Guard        AuthGuard: token ok? → request.user = { id, email }          ✗ → 401
   ▼  3. Pipes        ParseUUIDPipe no :id; ValidationPipe no body (UpdateTaskDto)  ✗ → 400
   ▼  4. Controller   update(@CurrentUser() user, @Param('id') id, @Body() dto)
   ▼  5. Service      findOne(user.id, id) → é dele?                               ✗ → 404
   │                  prisma.task.update(...)
   ▼  6. Resposta     objeto → JSON, status 200
```
A ordem é fixa no Nest: **Guards antes de Pipes**. Faz sentido: não adianta validar o body de quem nem deveria entrar.

```ts
@Controller('tasks')
@UseGuards(AuthGuard)                         // passo 2, vale para todas as rotas da classe
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,              // decorator nosso: lê request.user
    @Param('id', ParseUUIDPipe) id: string,     // passo 3: pipe no parâmetro da URL
    @Body() dto: UpdateTaskDto,                 // passo 3: ValidationPipe global no body
  ) {
    return this.tasksService.update(user.id, id, dto); // passo 4 → 5
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)            // 204
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
```

### Exceções viram respostas
Em vez de montar a resposta de erro na mão, o service **lança** uma exceção HTTP e o Nest a converte em JSON com o status certo:
```ts
const task = await this.prisma.task.findFirst({ where: { id, userId } }); // id E dono
if (!task) throw new NotFoundException('Tarefa não encontrada');
// resposta: 404 {"message":"Tarefa não encontrada","error":"Not Found","statusCode":404}
```
| Exceção | Status | Onde usamos |
|---|---|---|
| `BadRequestException` | 400 | lançada pelo ValidationPipe e pelo ParseUUIDPipe |
| `UnauthorizedException` | 401 | AuthGuard e login |
| `NotFoundException` | 404 | tarefa inexistente ou de outro usuário |
| `ConflictException` | 409 | e-mail já cadastrado |

### Módulos que emprestam peças
O `TasksController` usa o `AuthGuard`, que mora no `AuthModule`. Para isso:
```ts
// auth.module.ts
@Module({ ..., providers: [AuthService, AuthGuard], exports: [AuthGuard, JwtModule] })
// tasks.module.ts
@Module({ imports: [AuthModule], controllers: [TasksController], providers: [TasksService] })
```
Sem o `exports`, a API não sobe: `Nest can't resolve dependencies of the AuthGuard (?)`. Diferente do `PrismaModule` (que é `@Global()`), aqui preferimos importar explicitamente: fica visível no código quais módulos dependem de autenticação.

### Experimente: o ciclo completo em 6 comandos
Com a API rodando (`npm run start:dev`) e um token em mãos (veja a aula 9):
```bash
T="Authorization: Bearer COLE_O_TOKEN"; J="Content-Type: application/json"   # atalhos para os cabeçalhos
curl -s -X POST localhost:3000/tasks -H "$T" -H "$J" -d '{"title":"Estudar Guards","priority":"HIGH"}'  # 201, guarde o id
curl -s localhost:3000/tasks -H "$T"                                                                  # 200, lista
curl -s -X PATCH localhost:3000/tasks/ID -H "$T" -H "$J" -d '{"status":"DONE"}'                       # 200, status DONE
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:3000/tasks/ID -H "$T"                    # 204
curl -s localhost:3000/tasks/ID -H "$T"                                                               # 404, já foi apagada
curl -s localhost:3000/tasks/nao-e-uuid -H "$T"                                                       # 400, uuid is expected
```

### Armadilhas novas
- **Esquecer `@UseGuards(AuthGuard)`** num controller novo: a rota fica pública. Sintoma: responde `200` sem token. Confira sempre com um `curl` sem `Authorization`.
- **Filtrar só por `id`** (`findUnique({ where: { id } })`): qualquer usuário logado leria a tarefa de outro sabendo o id. Sempre `where: { id, userId }`.
- **Responder `403` para tarefa de outro usuário:** revela que o id existe. Preferimos `404`.
- **Espalhar o DTO direto no Prisma** (`data: { ...dto }`): o lint avisa (`no-misused-spread`) e qualquer campo extra iria para o banco. Montamos o objeto campo a campo (`toData` no `TasksService`).

### Teste seu entendimento (evolução)
<details><summary>5. Em que ordem rodam Guard, Pipe e Controller? Por quê?</summary>

Guard → Pipes → Controller. Primeiro decide se o pedido pode entrar; só depois vale a pena validar os dados; por fim o controller trabalha com dados confiáveis.
</details>

<details><summary>6. Por que o DELETE responde 204 e não 200?</summary>

204 No Content significa "deu certo e não há nada para devolver". Depois de apagar, não existe recurso para mostrar.
</details>

<details><summary>7. O que acontece se o <code>AuthModule</code> não exportar o <code>AuthGuard</code>?</summary>

O `TasksModule` não consegue usar o Guard e a API não sobe: `Nest can't resolve dependencies of the AuthGuard (?)`.
</details>

---

## 🚀 Evolução Prática (Projeto: flowmind-ai) - CORS: liberando a API para o front-end

> Fase 4 do FlowMind: o front em Next.js ([aula 13](../../frontend/nextjs/nextjs.md)) roda em `http://localhost:3001` e chama a API em `http://localhost:3000`. Sem configuração, o **navegador** bloqueia isso.

### O problema
Com a API funcionando no `curl`, o primeiro login pelo front falha com este erro no console do navegador (F12):
```
Access to fetch at 'http://localhost:3000/auth/login' from origin 'http://localhost:3001'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present...
```
O `curl` funcionava porque **CORS é uma regra do navegador**, não do servidor nem da rede.

**Analogia: a portaria do condomínio.** O navegador é o **porteiro** que protege o morador (o usuário). Um site só pode buscar dados de **outro endereço** se esse endereço tiver deixado, na portaria, uma **lista de visitantes autorizados**. A API precisa dizer: "o `localhost:3001` pode entrar". *Onde falha:* um porteiro de verdade barra a pessoa **antes** de ela entrar. No CORS, o pedido muitas vezes **chega** ao servidor; o navegador só impede que o site **leia a resposta**.

### Glossário novo
| Termo | Em uma frase |
|---|---|
| **Origem (origin)** | Protocolo + domínio + porta: `http://localhost:3001` e `http://localhost:3000` são origens **diferentes**. |
| **Same-origin policy** | Regra do navegador: um site só lê respostas da própria origem, salvo autorização. |
| **CORS** | *Cross-Origin Resource Sharing*: cabeçalhos com que a API autoriza outras origens a ler suas respostas. |
| **Preflight** | Pedido `OPTIONS` que o navegador faz **antes** de certos pedidos (com `Authorization`, JSON, `PATCH`...) para perguntar se pode. |
| **`Access-Control-Allow-Origin`** | Cabeçalho da resposta que diz qual origem está autorizada. |

### Como ficou no projeto
`apps/api/src/main.ts`:
```ts
app.enableCors({
  origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3001')
    .split(',')                // várias origens? separe por vírgula no .env
    .map((o) => o.trim()),
});
```
`apps/api/.env.example`:
```bash
WEB_ORIGIN=http://localhost:3001   # em produção: https://app.flowmind.dev (nunca "*" com login)
```

### Por trás dos panos: o preflight
Um `PATCH /tasks/:id` com `Authorization` e JSON vira **dois** pedidos no navegador:
```
1. OPTIONS /tasks/:id                            ← "posso?"
   Origin: http://localhost:3001
   Access-Control-Request-Method: PATCH
   Access-Control-Request-Headers: authorization,content-type
   ⇢ 204  Access-Control-Allow-Origin: http://localhost:3001
          Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
          Access-Control-Allow-Headers: authorization,content-type
2. PATCH /tasks/:id  (o pedido de verdade, só se o 1 autorizou)
```
Testamos com `curl` as duas situações: com `Origin: http://localhost:3001` a resposta traz `Access-Control-Allow-Origin`; com `Origin: http://site-malicioso.com` o cabeçalho **não vem**, e o navegador desse site bloqueia a leitura.

**CORS não é autenticação.** Ele só controla quais **sites, dentro de um navegador**, podem ler as respostas. Um script ou o `curl` ignoram o CORS. Quem protege os dados continua sendo o `AuthGuard` com JWT.

### Bônus da Fase 4: `undefined` × `null` no Prisma
Ao criar o diálogo de edição, descobrimos que **não dava para remover o prazo** de uma tarefa: o front mandava `dueDate: null`, a validação aceitava (`@IsOptional` deixa passar `null`), mas o service convertia `null` em `undefined`, e para o Prisma **`undefined` significa "não mexa neste campo"**. A correção separou os três casos:
```ts
private toDueDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;   // campo não enviado: mantém o prazo
  if (value === null) return null;             // "sem prazo": grava NULL no banco
  return new Date(value);                      // novo prazo
}
```
Ficou num commit próprio, `fix(api): permite remover o prazo de uma tarefa`, porque é uma correção, não uma funcionalidade.

### Experimente
```bash
# com a API rodando:
curl -s -o /dev/null -D - -X OPTIONS localhost:3000/tasks \
  -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: PATCH" | grep -i access-control
# esperado: Access-Control-Allow-Origin: http://localhost:3001 (e os métodos liberados)

curl -s -o /dev/null -D - -X OPTIONS localhost:3000/tasks \
  -H "Origin: http://site-malicioso.com" -H "Access-Control-Request-Method: PATCH" | grep -i access-control
# esperado: nenhuma linha (origem não autorizada)
```
Depois, troque `WEB_ORIGIN` para `http://localhost:4000` no `apps/api/.env`, reinicie a API e tente logar pelo front: o console mostra o erro de CORS. **Desfaça** voltando para `http://localhost:3001` e reiniciando.

### Armadilhas novas
- **`origin: '*'` (qualquer site).** Prático, mas libera qualquer página a usar a API pelo navegador de quem está logado. Liste as origens.
- **Origem com barra no fim** (`http://localhost:3001/`). Não casa com o cabeçalho `Origin`, que vem sem barra.
- **Achar que CORS é bug do servidor.** O `curl` funciona e o navegador não: é CORS. Olhe o console do navegador e o pedido `OPTIONS` na aba *Network*.

### Teste seu entendimento (evolução)
<details><summary>8. Por que o <code>curl</code> funcionava e o front não?</summary>

Porque CORS é uma regra aplicada pelo navegador para proteger o usuário. O `curl` não é um navegador e ignora o CORS.
</details>

<details><summary>9. O que é o preflight e quando ele acontece?</summary>

Um pedido `OPTIONS` que o navegador faz antes de pedidos "não simples" (com `Authorization`, JSON, `PATCH`, `DELETE`...) para perguntar à API se aquela origem, método e cabeçalhos são permitidos.
</details>

<details><summary>10. Para o Prisma, qual a diferença entre <code>dueDate: undefined</code> e <code>dueDate: null</code>?</summary>

`undefined` = não mexer no campo. `null` = gravar NULL (sem prazo). Converter um no outro faz o "remover prazo" falhar em silêncio.
</details>
