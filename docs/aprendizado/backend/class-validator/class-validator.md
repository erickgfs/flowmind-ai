# 🎓 Aula: Validação de entrada com DTOs (class-validator)
> **Categoria:** `backend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 8 de 10 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/1Txi2dM71ypUPJDt88vktu) · arquivo local [`class-validator.html`](./class-validator.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 6: [NestJS](../nestjs/nestjs.md)**. Você precisa saber o que é controller, service, module e decorator (`@Algo()`).
- **Aula 5: [Node.js, npm e TypeScript](../nodejs/nodejs.md)**. Usamos *classes* e *tipos* do TypeScript.
- **Corpo da requisição (em poucas linhas):** num `POST` ou `PATCH`, o cliente manda dados junto com o pedido, normalmente em JSON. Isso se chama **body** (corpo). Exemplo: `POST /auth/register` com o body `{ "email": "ana@x.com", "name": "Ana", "password": "12345678" }`.
- **Código de status HTTP:** número que a API devolve junto com a resposta. `2xx` = deu certo (`200 OK`, `201 Created`, `204 No Content`). `4xx` = o cliente errou (`400 Bad Request` = dados inválidos, `401` = não autenticado, `404` = não encontrado, `409` = conflito). `5xx` = a API quebrou.

### 🎯 O que é e qual problema resolve
**O problema.** Uma API recebe dados de qualquer pessoa na internet. Sem verificação, chega de tudo: e-mail `"abc"`, senha vazia, `status: "FEITO"` (que não existe no banco), um título com 2 milhões de caracteres, ou um campo `userId` que alguém acrescentou para criar tarefas em nome de outra pessoa. Se esses dados forem direto para o banco, o resultado vai de erro feio (`500`) até falha de segurança. Escrever `if (!email.includes('@')) ...` em cada rota é repetitivo e fácil de esquecer.

**A solução.** Descrevemos o **formato esperado** do body numa classe chamada **DTO** (*Data Transfer Object*, "objeto de transferência de dados"). Cada campo recebe etiquetas (decorators) da biblioteca **class-validator**: `@IsEmail()`, `@MinLength(8)`, `@IsEnum(TaskStatus)`. Um **ValidationPipe** global do Nest confere todo body que chega contra o DTO. Se algo estiver errado, ele responde `400 Bad Request` com a lista de problemas, **antes** do controller rodar.

**Analogia: o formulário do cartório com o atendente da triagem.**
- O **DTO** é o **formulário oficial**: diz quais campos existem e as regras de cada um ("CPF com 11 dígitos", "data no formato dia/mês/ano").
- Os **decorators** do class-validator são as **instruções impressas** ao lado de cada campo.
- O **ValidationPipe** é o **atendente da triagem**: confere o formulário antes de mandar para o escrivão. Campo errado? Devolve na hora com a lista do que corrigir. Campo extra rabiscado que não existe no formulário? Recusa o papel (`forbidNonWhitelisted`).
- O **controller/service** é o **escrivão**: só recebe formulários que já passaram pela triagem.

*Onde a analogia falha:* o atendente confere **formato**, não **verdade**. Ele sabe que `ana@x.com` tem cara de e-mail, mas não sabe se o e-mail já está cadastrado. Esse tipo de regra (consultar o banco) continua no service.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Body (corpo)** | Os dados que o cliente envia junto com um pedido `POST`/`PATCH`, geralmente em JSON. |
| **Status HTTP** | Número da resposta que diz se deu certo (`2xx`), se o cliente errou (`4xx`) ou se a API falhou (`5xx`). |
| **DTO** | Classe que descreve o formato exato dos dados que entram na API. |
| **class-validator** | Biblioteca que fornece decorators de regra (`@IsEmail`, `@MinLength`) e checa um objeto contra eles. |
| **class-transformer** | Biblioteca que transforma um JSON simples numa instância da classe DTO e permite ajustar valores (`@Transform`). |
| **Pipe** | Peça do Nest que roda antes do controller para **validar** ou **converter** um dado de entrada. |
| **ValidationPipe** | Pipe oficial que usa o class-validator para validar o body contra o DTO. |
| **whitelist** | Opção que descarta campos que não estão no DTO. |
| **forbidNonWhitelisted** | Opção que, em vez de descartar, responde `400` quando chegam campos desconhecidos. |
| **transform** | Opção que entrega ao controller uma instância real do DTO (e ativa os `@Transform`). |
| **PartialType** | Função do `@nestjs/mapped-types` que cria um DTO com os mesmos campos e regras, mas todos opcionais. |
| **Enum** | Lista fechada de valores permitidos, como `TODO`, `IN_PROGRESS`, `DONE`. |
| **ISO 8601** | Formato padrão de data em texto: `2026-12-31` ou `2026-12-31T18:00:00Z`. |
| **ParseUUIDPipe** | Pipe pronto do Nest que confere se um parâmetro da URL é um UUID válido. |

### 🏗️ Como funciona no nosso projeto
```
apps/api/src/
├── main.ts                       liga o ValidationPipe para TODAS as rotas
├── auth/dto/
│   ├── register.dto.ts           email, name, password (8 a 72 caracteres)
│   └── login.dto.ts              email, password
└── tasks/dto/
    ├── create-task.dto.ts        title, description?, status?, priority?, dueDate?
    └── update-task.dto.ts        PartialType(CreateTaskDto): tudo opcional, para PATCH
```

**1) O ValidationPipe global** (`src/main.ts`):
```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // ignora o que não está no DTO...
    forbidNonWhitelisted: true, // ...e responde 400 se vier campo desconhecido
    transform: true,            // transforma o JSON numa instância do DTO (ativa @Transform)
  }),
);
```

**2) Um DTO** (`src/auth/dto/register.dto.ts`):
```ts
export class RegisterDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido' })
  email: string;          // " Ana@X.com " vira "ana@x.com" antes de validar

  @IsString()
  @MinLength(8, { message: 'password deve ter pelo menos 8 caracteres' })
  @MaxLength(72)          // o bcrypt ignora o que passa de 72 bytes (aula 9)
  password: string;
}
```

**3) O controller só declara o tipo** (`src/auth/auth.controller.ts`):
```ts
@Post('register')
register(@Body() dto: RegisterDto) {   // o Nest lê o tipo RegisterDto e valida o body com ele
  return this.authService.register(dto);
}
```

**4) Enum vindo do Prisma** (`src/tasks/dto/create-task.dto.ts`): usamos o mesmo `TaskStatus` gerado a partir do `schema.prisma` (aula 7). Se um dia acrescentarmos um status no schema, a validação acompanha sozinha.
```ts
@IsOptional()                 // pode faltar; se vier, tem que obedecer à regra abaixo
@IsEnum(TaskStatus)           // só aceita TODO, IN_PROGRESS ou DONE
status?: TaskStatus;
```

**5) Reaproveitar regras com PartialType** (`src/tasks/dto/update-task.dto.ts`):
```ts
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
// mesmas regras do CreateTaskDto, mas todos os campos opcionais (ideal para PATCH)
```

**Repare no que NÃO existe no `CreateTaskDto`: o campo `userId`.** O dono da tarefa vem do token de login (aula 9), nunca do body. Com `forbidNonWhitelisted`, quem tentar mandar `userId` recebe `400 property userId should not exist`.

### 🧠 Conceito Teórico / Por trás dos panos
**Como o Nest sabe qual DTO usar?** O TypeScript, com a opção `emitDecoratorMetadata` (ligada no `tsconfig.json`), grava junto do código compilado o **tipo** de cada parâmetro decorado. Quando o Nest vê `@Body() dto: RegisterDto`, ele lê esse registro e descobre "o body deve ser um `RegisterDto`". Por isso o DTO **precisa ser uma classe** e ser importado como valor (`import { RegisterDto }`), não como `import type` nem como `interface`: interfaces e `import type` somem na compilação e o Nest não teria o que ler.

**O que acontece com um pedido, passo a passo:**
1. Chega `POST /auth/register` com um JSON.
2. O Express transforma o texto JSON num objeto JavaScript comum.
3. O ValidationPipe chama o **class-transformer** (`plainToInstance`): o objeto vira `new RegisterDto()` com os campos preenchidos. Nessa hora rodam os `@Transform` (trim, minúsculas).
4. O pipe chama o **class-validator** (`validate`): ele percorre os decorators de cada campo e junta os erros.
5. Se houver erros → `400 Bad Request` com `message: [ ...lista de erros ]`. O controller nem é chamado.
6. Se estiver tudo certo → o controller recebe o DTO limpo e confiável.

**Ordem dos decorators.** Os decorators de validação são independentes entre si: o class-validator roda todos e devolve todos os erros de uma vez. Já o `@Transform` é do class-transformer e sempre roda **antes** da validação (passo 3), qualquer que seja a posição dele no código.

**Pipes na URL.** Além do body, a URL também tem entradas: em `GET /tasks/:id`, o `:id` é um **parâmetro de rota**. Usamos `@Param('id', ParseUUIDPipe)` para responder `400 Validation failed (uuid is expected)` se alguém pedir `/tasks/123`. Sem isso, o Postgres receberia um texto que não é UUID e a API devolveria `500`.

### 🛠️ Comandos e Operação
```bash
# Instalar (já feito no projeto; versões fixadas para combinar com o NestJS 12)
npm install class-validator@0.15.1 class-transformer@0.5.1 @nestjs/mapped-types@12.0.1

# Subir a API (dentro de apps/api, com o Docker do Postgres rodando)
npm run start:dev

# Mandar um body inválido de propósito (-s = sem barra de progresso, -X = método, -H = cabeçalho, -d = body)
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"x","name":"A","password":"123"}'
# Saída esperada (400):
# {"message":["email deve ser um endereço de e-mail válido",
#             "name deve ter pelo menos 2 caracteres",
#             "password deve ter pelo menos 8 caracteres"],
#  "error":"Bad Request","statusCode":400}

# Ver só o status HTTP (-o /dev/null descarta o corpo, -w imprime o código)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks/123
```

### 🧪 Experimente você mesmo
Vamos acrescentar uma regra ao DTO de tarefas e ver o ValidationPipe trabalhando.

1. **Suba a API:** `cd apps/api` e `npm run start:dev`. Esperado: `Nest application successfully started`.
2. **Crie um usuário e pegue o token** (detalhes na aula 9):
   ```bash
   curl -s -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
     -d '{"email":"teste-dto@flowmind.dev","name":"Teste","password":"senha-forte-123"}'
   ```
   Copie o valor de `accessToken` da resposta.
3. **Mande uma tarefa com prioridade inválida:**
   ```bash
   curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
     -H "Authorization: Bearer COLE_O_TOKEN_AQUI" -d '{"title":"x","priority":"URGENTE"}'
   ```
   Esperado: `400` com `priority deve ser um de: LOW, MEDIUM, HIGH`.
4. **Acrescente uma regra:** em `src/tasks/dto/create-task.dto.ts`, troque `@MaxLength(200)` do `title` por `@MaxLength(10)` e salve (o `start:dev` reinicia sozinho).
5. **Teste:** mande `{"title":"um título bem comprido"}`. Esperado: `400` com `title must be shorter than or equal to 10 characters` (mensagem padrão em inglês, porque não passamos `message`).
6. **Teste o campo proibido:** mande `{"title":"ok","userId":"qualquer"}`. Esperado: `400 property userId should not exist`.
7. **Desfaça:** volte o `@MaxLength(200)`. Para apagar o usuário de teste, no Prisma Studio (`npm run prisma:studio`) abra `User` e exclua `teste-dto@flowmind.dev` (as tarefas dele vão junto, por causa do `onDelete: Cascade`).

### ⚠️ Armadilhas Comuns
- **Validação "não funciona" e qualquer body passa.** Sintoma: nenhum `400`, dados ruins chegam ao banco. Causa: esqueceu o `app.useGlobalPipes(new ValidationPipe(...))` no `main.ts`, ou o DTO é uma `interface`. Correção: ligue o pipe e use `class`.
- **DTO importado com `import type`.** Sintoma: igual ao anterior, a validação é ignorada em silêncio. Correção: `import { CreateTaskDto } from ...` (import de valor).
- **Campo opcional rejeitado quando não é enviado.** Sintoma: `description must be a string` mesmo sem mandar `description`. Causa: faltou `@IsOptional()`. Correção: acrescente-o antes das outras regras do campo.
- **`@Transform` não roda.** Sintoma: e-mail com espaço ou maiúsculas chega cru ao service. Causa: falta `transform: true` no ValidationPipe. Correção: ligue a opção.
- **`500 Internal Server Error` ao pedir `/tasks/abc`.** Causa: o `:id` não foi validado e o Postgres recusou um texto que não é UUID. Correção: `@Param('id', ParseUUIDPipe)`.
- **Confiar no DTO para regra de negócio.** "E-mail já cadastrado" não é formato, é consulta ao banco. Isso fica no service e responde `409 Conflict`.

### 🤔 Por que usamos / Quando usar
- **Uma barreira só, na porta de entrada.** Todas as rotas ficam protegidas sem `if` espalhado.
- **Documentação viva.** Quem abre o DTO vê na hora o que a rota aceita.
- **Segurança.** O `forbidNonWhitelisted` impede o *mass assignment* (alguém enviar campos como `userId` ou `isAdmin` que nunca deveriam vir do cliente).
- **Padrão do ecossistema Nest**, presente na documentação oficial e em vagas.

Quando outra opção é melhor: projetos fora do Nest, ou que preferem *schemas* em vez de classes, costumam usar **Zod** (valida e gera o tipo TypeScript ao mesmo tempo; dá para compartilhar o mesmo schema com o frontend). No Nest também existe integração com Zod, mas o class-validator é o caminho padrão e o que a documentação ensina primeiro.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia do cartório, quem é o DTO e quem é o ValidationPipe?</summary>

O DTO é o formulário oficial (quais campos e regras existem). O ValidationPipe é o atendente da triagem, que confere o formulário e devolve com a lista de erros antes de chegar ao escrivão (controller/service).
</details>

<details><summary>2. Qual a diferença entre <code>whitelist</code> e <code>forbidNonWhitelisted</code>?</summary>

`whitelist: true` descarta em silêncio os campos que não estão no DTO. `forbidNonWhitelisted: true` vai além: responde `400` dizendo qual campo não deveria existir. Usamos os dois.
</details>

<details><summary>3. Por que o DTO precisa ser uma <code>class</code> e não uma <code>interface</code>?</summary>

Interfaces somem quando o TypeScript vira JavaScript. O Nest precisa de algo que exista em tempo de execução para ler o tipo do parâmetro e os decorators de regra. Classes continuam existindo.
</details>

<details><summary>4. Por que o <code>CreateTaskDto</code> não tem <code>userId</code>?</summary>

Porque o dono da tarefa é quem está logado, e isso vem do token JWT. Se aceitássemos `userId` no body, qualquer pessoa criaria tarefas em nome de outra.
</details>

<details><summary>5. O que o <code>PartialType(CreateTaskDto)</code> faz e por que usamos no PATCH?</summary>

Cria uma classe com os mesmos campos e regras, mas todos opcionais. No `PATCH` o cliente manda só o que quer mudar, e as regras ficam escritas num lugar só.
</details>
