# 🎓 Aula: Autenticação com JWT e bcrypt
> **Categoria:** `backend` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 9 de 10 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/DgRCz9NefojNgi4jwHxfBt) · arquivo local [`jwt-bcrypt.html`](./jwt-bcrypt.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 6: [NestJS](../nestjs/nestjs.md)** (controller, service, module, injeção de dependências).
- **Aula 7: [Prisma](../../databases/prisma/prisma.md)** (como lemos e gravamos usuários no banco).
- **Aula 8: [Validação com DTOs](../class-validator/class-validator.md)** (como o body do registro/login é conferido, e os códigos de status `400`, `401`, `409`).
- **Cabeçalho HTTP (em poucas linhas):** além do body, todo pedido carrega **cabeçalhos** (*headers*), etiquetas do tipo `Nome: valor`. Exemplo: `Content-Type: application/json` diz "o body é JSON". Nesta aula usamos o cabeçalho `Authorization`.
- **HTTP não tem memória:** cada pedido chega sozinho. A API não "lembra" que você fez login há 5 segundos. Por isso o cliente precisa provar quem é **em todo pedido**.

### 🎯 O que é e qual problema resolve
**O problema tem duas metades.**
1. **Guardar senhas.** Se a tabela `users` guardar `senha = "minhaSenha123"` e o banco vazar (backup esquecido, invasão, funcionário curioso), todas as contas ficam expostas, inclusive em outros sites, porque as pessoas repetem senhas.
2. **Provar quem é a cada pedido.** Como o HTTP não tem memória, depois do login o cliente precisa mostrar algo em cada pedido seguinte. Mandar e-mail e senha toda vez é arriscado e lento. E a API precisa confiar nesse "algo" sem consultar o banco a cada pedido.

**A solução também tem duas metades.**
1. **bcrypt** transforma a senha num **hash**: uma "impressão digital" embaralhada, de mão única. Guardamos só o hash. No login, o bcrypt embaralha a senha digitada do mesmo jeito e compara as impressões. Ninguém consegue fazer o caminho de volta (hash → senha).
2. **JWT** (*JSON Web Token*) é um **crachá digital** que a API entrega no login. Ele diz "este é o usuário X, válido até tal hora" e vem **assinado** com um segredo que só a API conhece. Em cada pedido o cliente mostra o crachá no cabeçalho `Authorization: Bearer <token>`. Um **AuthGuard** confere a assinatura e a validade antes de deixar o pedido entrar.

**Analogia: a portaria de um prédio comercial.**
- **Cadastro (register):** você se apresenta na portaria. O porteiro não anota sua senha num caderno; ele anota só uma **impressão digital** dela (bcrypt). Se o caderno for roubado, ninguém tem as senhas.
- **Login:** você volta, diz a senha, o porteiro tira a impressão digital dela e compara com a do caderno. Bateu? Ele te entrega um **crachá com holograma** (JWT) escrito "Ana, válido até 16h".
- **Andar pelo prédio:** em cada porta (rota protegida) há um **segurança** (AuthGuard). Ele não liga para a portaria; só olha o crachá: o holograma é original (assinatura)? Ainda está dentro do horário (expiração)? Então entra.

*Onde a analogia falha:* um crachá de verdade dá para tomar de volta na saída. Um JWT **não**: depois de emitido, ele vale até expirar, mesmo que a pessoa clique em "sair". Por isso usamos validade curta (1 hora). Revogar tokens antes da hora exige peças extras (lista de bloqueio no Redis, *refresh tokens*), assunto para uma fase futura.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Autenticação** | Descobrir **quem** está fazendo o pedido ("você é a Ana?"). |
| **Autorização** | Decidir **o que** essa pessoa pode fazer ("a Ana pode ver esta tarefa?"). |
| **Hash** | Resultado de embaralhar um dado de forma irreversível: mesma entrada, mesmo resultado; impossível voltar. |
| **bcrypt** | Algoritmo de hash feito para senhas: lento de propósito e com sal embutido. |
| **Sal (salt)** | Pedaço aleatório misturado à senha antes do hash, para que duas senhas iguais gerem hashes diferentes. |
| **Custo (salt rounds)** | Quantas vezes o bcrypt repete o trabalho (10 = 2¹⁰ rodadas). Mais custo, mais lento para atacar. |
| **Cabeçalho (header)** | Etiqueta `Nome: valor` que acompanha um pedido HTTP. |
| **JWT** | Token em texto com três partes (`cabeçalho.payload.assinatura`) que prova quem é o usuário. |
| **Payload** | A parte do JWT com os dados: aqui `sub` (id do usuário), `email`, `iat` (emitido em) e `exp` (expira em). |
| **Assinatura** | Código calculado com o payload + o segredo; se alguém mexer no payload, a assinatura não bate. |
| **JWT_SECRET** | O segredo que só a API conhece, usado para assinar e conferir tokens. Fica no `.env`. |
| **Bearer token** | Forma padrão de enviar o token: `Authorization: Bearer <token>` ("o portador deste token"). |
| **Guard** | Peça do Nest que roda antes do controller e decide se o pedido entra. |
| **`request.user`** | Onde o AuthGuard deixa o usuário autenticado para o resto do pedido usar. |
| **Decorator de parâmetro** | Decorator criado por nós (`@CurrentUser()`) que entrega um pedaço do pedido ao método do controller. |
| **Timing attack** | Ataque que descobre informações medindo quanto tempo a API demora para responder. |

### 🏗️ Como funciona no nosso projeto
```
apps/api/src/auth/
├── auth.module.ts            configura o JwtModule com JWT_SECRET e JWT_EXPIRES_IN
├── auth.controller.ts        POST /auth/register (201) e POST /auth/login (200)
├── auth.service.ts           bcrypt.hash no registro, bcrypt.compare no login, assina o JWT
├── auth.guard.ts             AuthGuard: lê o Bearer token, confere e preenche request.user
├── current-user.decorator.ts @CurrentUser(): entrega request.user ao controller
├── auth.types.ts             JwtPayload, AuthUser, AuthResponse
└── auth.service.spec.ts      testes unitários (aula 10)
```

Variáveis novas em `apps/api/.env` (o `.env.example` tem a versão sem segredo):
```bash
JWT_SECRET="...48 bytes aleatórios..."   # gerado com crypto.randomBytes; NUNCA vai para o Git
JWT_EXPIRES_IN=3600                       # validade do token em segundos (1 hora)
```

**Registro** (`auth.service.ts`):
```ts
const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
if (existing) throw new ConflictException('E-mail já cadastrado');        // 409

const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS); // custo 10
const user = await this.prisma.user.create({ data: { email: dto.email, name: dto.name, passwordHash } });
return this.buildResponse(user);  // { accessToken, user: { id, email, name } } — sem passwordHash!
```

**Login** (`auth.service.ts`):
```ts
const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
// Se o e-mail não existe, comparamos com um hash falso (DUMMY_HASH) para gastar o mesmo tempo
const passwordOk = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
if (!user || !passwordOk) throw new UnauthorizedException('Credenciais inválidas'); // 401, mesma mensagem
```

**Assinar o token** (`buildResponse`):
```ts
const payload: JwtPayload = { sub: user.id, email: user.email };
const accessToken = await this.jwt.signAsync(payload); // usa o JWT_SECRET configurado no AuthModule
```

**O porteiro** (`auth.guard.ts`):
```ts
const [type, token] = request.headers.authorization?.split(' ') ?? [];
if (type !== 'Bearer' || !token) throw new UnauthorizedException('Token de acesso ausente');
try {
  const payload = await this.jwt.verifyAsync<JwtPayload>(token); // confere assinatura e exp
  request.user = { id: payload.sub, email: payload.email };       // pendura o usuário no pedido
} catch {
  throw new UnauthorizedException('Token inválido ou expirado');
}
return true;
```

**Usando o Guard** (`tasks/tasks.controller.ts`):
```ts
@Controller('tasks')
@UseGuards(AuthGuard)                 // toda rota desta classe exige token
export class TasksController {
  @Get()
  findAll(@CurrentUser() user: AuthUser) {        // user = { id, email } vindo do token
    return this.tasksService.findAll(user.id);    // só as tarefas DESTE usuário
  }
}
```
O `TasksModule` importa o `AuthModule`, que **exporta** o `AuthGuard` e o `JwtModule` (o Guard precisa do `JwtService`).

### 🧠 Conceito Teórico / Por trás dos panos
**Por dentro de um hash bcrypt.** Um hash salvo no banco é assim:
```
$2b$10$dK61lhoXGB.AqV5sGME35u D5Rjx/8tbShqsdMHokuPJLAp9OXObNa
 │   │  └── sal (22 caracteres) ┘└── hash da senha (31 caracteres)
 │   └── custo: 10 → 2^10 = 1024 rodadas
 └── versão do algoritmo
```
O sal fica **dentro** do próprio hash. Por isso o `bcrypt.compare(senhaDigitada, hashSalvo)` consegue repetir exatamente o mesmo embaralhamento e comparar. Como cada usuário tem um sal aleatório, duas pessoas com a senha `123456` têm hashes diferentes, e tabelas prontas de "senha → hash" (*rainbow tables*) não servem.

**Por que lento é bom?** Um hash comum (como SHA-256) roda bilhões de vezes por segundo numa placa de vídeo, então um atacante com o banco vazado testaria bilhões de senhas por segundo. O bcrypt com custo 10 leva perto de 50–100 ms por tentativa: imperceptível para quem faz login, mas inviável para quem tenta milhões de senhas. Cada +1 no custo dobra o tempo.

**Limite de 72 bytes.** O bcrypt só usa os primeiros 72 bytes da senha. Por isso o `RegisterDto` tem `@MaxLength(72)`: senhas maiores teriam o final ignorado em silêncio.

**Por dentro de um JWT.** O token é texto com três partes separadas por ponto, cada uma em **Base64URL** (uma forma de escrever bytes só com letras, números, `-` e `_`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiJhNjI1Li4uIiwiZXhwIjoxNzk0MDgxMTY1fQ . dD47275Cym_PHRn...
└── cabeçalho: {"alg":"HS256"}        └── payload: {"sub":"a625...","email":"...","iat":...,"exp":...}   └── assinatura
```
- **Base64URL não é criptografia.** Qualquer pessoa decodifica o payload e lê o conteúdo. Por isso **nunca** colocamos senha ou dado sensível no payload; só o id e o e-mail.
- A **assinatura** é `HMAC-SHA256(cabeçalho + "." + payload, JWT_SECRET)`. Se alguém trocar o `sub` do payload para o id de outra pessoa, a assinatura calculada pela API não bate com a que veio no token, e o `verifyAsync` lança erro → `401`.
- O `verifyAsync` também confere o `exp` (expiração). Passou da hora → erro → `401`.
- **Stateless (sem estado):** a API não guarda os tokens em lugar nenhum. Ela confia na matemática da assinatura. Vantagem: nenhuma consulta ao banco para autenticar. Desvantagem: não dá para "cancelar" um token antes do `exp` sem infraestrutura extra.

**Por que a mesma mensagem e o DUMMY_HASH?** Se "e-mail não existe" respondesse rápido e com mensagem diferente de "senha errada", um atacante descobriria quais e-mails têm conta (*enumeração de usuários*). Respondemos sempre `401 Credenciais inválidas` e, quando o e-mail não existe, ainda rodamos um `bcrypt.compare` contra um hash falso para o tempo de resposta ficar parecido.

**Autenticação × autorização no CRUD de tarefas.** O AuthGuard resolve **quem** você é. O **o que** você pode fazer fica no `TasksService`: toda consulta filtra por `userId`. Pedir a tarefa de outra pessoa devolve `404 Tarefa não encontrada` (e não `403`), para nem confirmar que ela existe.

### 🛠️ Comandos e Operação
```bash
# Instalar (já feito; versões compatíveis com NestJS 12)
npm install @nestjs/jwt@12.0.4 bcrypt@6.0.0
npm install -D @types/bcrypt@6.0.0          # tipos do TypeScript para o bcrypt

# Gerar um JWT_SECRET forte (48 bytes aleatórios em base64url)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# Registrar (201) — -d é o body em JSON
curl -s -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"email":"ana@flowmind.dev","name":"Ana","password":"senha-forte-123"}'

# Login (200) — devolve { accessToken, user }
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@flowmind.dev","password":"senha-forte-123"}'

# Usar o token numa rota protegida
curl -s http://localhost:3000/tasks -H "Authorization: Bearer COLE_O_TOKEN_AQUI"

# Sem token → 401 {"message":"Token de acesso ausente",...}
curl -s http://localhost:3000/tasks

# Ler o payload de um token no terminal (prova de que NÃO é criptografado)
node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')))" COLE_O_TOKEN_AQUI
```

### 🧪 Experimente você mesmo
Vamos ver na prática por que a assinatura protege o token.

1. **Suba a API:** `cd apps/api` e `npm run start:dev`.
2. **Registre dois usuários** (A e B) com o comando de registro acima, trocando o e-mail para `exp-a@flowmind.dev` e `exp-b@flowmind.dev`. Guarde os dois `accessToken` e o `user.id` de B.
3. **Crie uma tarefa com o token de A:**
   ```bash
   curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN_A" -d '{"title":"Segredo da A"}'
   ```
   Guarde o `id` da tarefa.
4. **Tente ler com o token de B:** `curl -s http://localhost:3000/tasks/ID_DA_TAREFA -H "Authorization: Bearer TOKEN_B"`.
   Esperado: `404 Tarefa não encontrada`. B não enxerga tarefas de A.
5. **Decodifique o token de A** com o comando `node -e ...` acima. Esperado: `{ sub: '<id de A>', email: 'exp-a@flowmind.dev', iat: ..., exp: ... }`. Repare que `exp - iat = 3600`.
6. **Tente falsificar:** mude **uma letra** no meio do token de A e chame `GET /tasks` com ele. Esperado: `401 Token inválido ou expirado`. A assinatura deixou de bater.
7. **Veja o hash no banco:** `npm run prisma:studio`, abra `User` e olhe a coluna `passwordHash` de A: começa com `$2b$10$`. A senha não aparece em lugar nenhum.
8. **Desfaça:** no Prisma Studio, exclua os usuários `exp-a` e `exp-b` (as tarefas vão junto pelo `onDelete: Cascade`).

### ⚠️ Armadilhas Comuns
- **`Error: Configuration key "JWT_SECRET" does not exist`.** A API nem sobe. Causa: a variável não está no `apps/api/.env`. Correção: copie do `.env.example` e gere um segredo com o comando acima.
- **`401 Token de acesso ausente` mesmo mandando o token.** Causa comum: esqueceu a palavra `Bearer ` (com espaço) ou escreveu `bearer`/`Token`. Correção: `Authorization: Bearer eyJ...`.
- **`Nest can't resolve dependencies of the AuthGuard (?)`.** Causa: o módulo que usa `@UseGuards(AuthGuard)` não importou o `AuthModule`, ou o `AuthModule` não exporta o `JwtModule`. Correção: `imports: [AuthModule]` e `exports: [AuthGuard, JwtModule]`.
- **Devolver o `passwordHash` na resposta.** Fácil de acontecer ao retornar o objeto `user` do Prisma direto. Correção: monte a resposta só com `id`, `email`, `name` (como no `buildResponse`).
- **Segredo fraco ou commitado** (`JWT_SECRET=123`, ou o `.env` no Git). Qualquer um assinaria tokens válidos. Correção: segredo longo e aleatório, `.env` no `.gitignore` (já está).
- **Guardar dado sensível no payload.** O payload é legível por qualquer um. Só ids e dados públicos.
- **`bcrypt` não instala no Windows/Linux** (`node-gyp`, `gyp ERR!`). O pacote é nativo (C++). O `bcrypt@6` traz binários prontos para Node 24; se falhar, use o `bcryptjs` (JavaScript puro, mesma API, um pouco mais lento).
- **Mensagens diferentes para e-mail inexistente e senha errada.** Permite descobrir quem tem conta. Use sempre a mesma.

### 🤔 Por que usamos / Quando usar
- **bcrypt** é o padrão consolidado para senhas, simples de usar e com custo ajustável. Alternativa mais moderna: **Argon2** (vencedor de uma competição de hash de senhas em 2015), também excelente.
- **JWT** combina com APIs consumidas por frontends separados (o futuro `apps/web` do FlowMind) e apps móveis: o token viaja no cabeçalho, não depende de cookies nem de memória no servidor, e escala para várias instâncias da API sem compartilhar sessão.
- **AuthGuard próprio** (em vez do Passport.js) deixa o mecanismo visível: são ~30 linhas que você entende por inteiro.

Quando outra opção é melhor: sites tradicionais renderizados no servidor costumam usar **sessão com cookie** (a sessão fica no servidor, revogável na hora). Quando você precisa de "logout imediato" ou "derrubar todas as sessões", JWT puro não basta; combine com *refresh tokens* e lista de bloqueio (por exemplo no Redis da aula 3). Para login com Google/GitHub, entra **OAuth 2.0**, que normalmente usa o Passport.js.

### ✅ Teste seu entendimento
<details><summary>1. Por que guardamos o hash e não a senha? E por que o bcrypt é lento de propósito?</summary>

Se o banco vazar, o atacante não tem as senhas, só impressões digitais irreversíveis. A lentidão (custo 10 ≈ dezenas de milissegundos) é imperceptível para um login, mas torna inviável testar milhões de senhas por força bruta.
</details>

<details><summary>2. O payload do JWT é secreto? O que impede alguém de trocar o <code>sub</code> para o id de outra pessoa?</summary>

Não é secreto: é só Base64URL, qualquer um lê. O que impede a troca é a assinatura: ela é calculada com o `JWT_SECRET`, que só a API conhece. Mudou o payload, a assinatura não bate e o `verifyAsync` recusa (`401`).
</details>

<details><summary>3. Qual a diferença entre autenticação e autorização no nosso CRUD de tarefas?</summary>

Autenticação = o AuthGuard confere o token e descobre quem é o usuário. Autorização = o `TasksService` filtra por `userId`, garantindo que cada um só mexe nas próprias tarefas.
</details>

<details><summary>4. Para que serve o <code>DUMMY_HASH</code> no login?</summary>

Quando o e-mail não existe, rodamos o `bcrypt.compare` contra um hash falso para gastar o mesmo tempo de uma senha errada. Junto com a mensagem igual (`Credenciais inválidas`), isso impede descobrir quais e-mails têm conta.
</details>

<details><summary>5. Por que o token tem validade curta (1 hora)?</summary>

Porque um JWT não pode ser cancelado antes de expirar sem infraestrutura extra. Se ele vazar, a janela de uso indevido fica pequena.
</details>
