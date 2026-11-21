# 🎓 Aula: Testes unitários com Vitest (e a relação com o Jest)
> **Categoria:** `testing-quality` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 10 de 10 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/6sXJM8gqc3tuLaVA2VMDRL) · arquivo local [`vitest.html`](./vitest.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 6: [NestJS](../../backend/nestjs/nestjs.md)**, principalmente **injeção de dependências**: é ela que permite trocar o banco de verdade por um banco falso no teste.
- **Aula 9: [Autenticação com JWT e bcrypt](../../backend/jwt-bcrypt/jwt-bcrypt.md)**. O teste desta aula verifica o `AuthService` de lá.
- **Promise e `await` (em poucas linhas):** uma função `async` devolve uma **Promise**, um "vale" de um resultado que chega depois (ex.: a resposta do banco). `await` espera o vale virar o resultado. Se der erro, a Promise é **rejeitada** (o equivalente assíncrono de "lançar uma exceção").

### 🎯 O que é e qual problema resolve
**O problema.** Para saber se o login funciona, você sobe o Docker, sobe a API, abre o terminal, manda `curl` com senha certa, senha errada, e-mail inexistente... e repete tudo **a cada mudança no código**. Um dia você muda uma linha do `AuthService`, esquece de testar o caso "senha errada", e a API passa a aceitar qualquer senha. Ninguém percebe até ser tarde.

**A solução.** Um **teste automatizado** é um código que usa o seu código e confere o resultado: "chame `login` com senha errada; **espero** que lance `UnauthorizedException`". O **Vitest** é a ferramenta que encontra esses arquivos (`*.spec.ts`), roda todos em segundos e mostra ✓ ou ✗. Um **teste unitário** testa **uma peça isolada** (aqui, só o `AuthService`), trocando tudo de que ela depende (banco, JWT) por **dublês** (*mocks*) que respondem o que nós mandarmos.

**Analogia: o teste de bancada do mecânico.**
- Para testar um **motor** (o `AuthService`), o mecânico não monta o carro inteiro e sai pela estrada. Ele prende o motor numa **bancada** (`Test.createTestingModule`).
- No lugar do tanque de verdade, liga uma **mangueira de combustível de teste** que ele controla (o *mock* do Prisma: "finja que o usuário existe", "finja que não existe").
- Liga **medidores** (`expect`) e confere: "girou na rotação certa?", "desligou quando cortei o combustível?".
- Se um medidor marcar errado, ele sabe que o defeito está **no motor**, não na estrada nem no tanque.

*Onde a analogia falha:* na bancada, o motor nunca prova que funciona **dentro do carro**. Do mesmo jeito, o teste unitário não prova que o Prisma salva no Postgres de verdade nem que a rota HTTP está ligada. Para isso existem os **testes de integração/e2e** (*end-to-end*, de ponta a ponta), que rodam a API inteira. Os dois tipos se completam.

**Jest × Vitest.** O pedido original era um teste em **Jest**, a ferramenta de testes mais conhecida do mundo JavaScript. O nosso projeto, porém, já veio do Nest CLI 12 com o **Vitest** configurado (`vitest.config.ts`, `npm test`). Os dois têm **a mesma API**: `describe`, `it`, `expect`, `beforeEach`, e `vi.fn()` no Vitest equivale a `jest.fn()`. Instalar o Jest junto criaria dois executores de teste brigando pelos mesmos arquivos `*.spec.ts`, e o Jest ainda tem suporte limitado ao modo ESM (`"type": "module"`) que o projeto usa. Por isso o teste foi escrito em Vitest. Tudo o que você aprender aqui vale no Jest trocando `vi.` por `jest.`.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Teste automatizado** | Código que executa o seu código e confere se o resultado é o esperado. |
| **Teste unitário** | Testa uma peça isolada, com as dependências substituídas por dublês. |
| **Teste de integração / e2e** | Testa várias peças juntas (ou a API inteira, com banco de verdade). |
| **Vitest** | Executor de testes moderno, rápido e compatível com ESM; é o que o projeto usa. |
| **Jest** | Executor de testes mais popular do JavaScript; API quase idêntica à do Vitest. |
| **`describe`** | Agrupa testes de um mesmo assunto ("AuthService", "login"). |
| **`it`** | Um caso de teste, com uma frase que diz o comportamento esperado. |
| **`expect`** | Faz uma verificação: `expect(valor).toBe(esperado)`. |
| **Matcher** | O verbo da verificação: `toBe`, `toEqual`, `toHaveBeenCalledWith`, `rejects.toThrow`. |
| **Mock (dublê)** | Objeto ou função falsa que substitui uma dependência real e cujo retorno controlamos. |
| **`vi.fn()`** | Cria uma função falsa que registra como foi chamada (`jest.fn()` no Jest). |
| **`mockResolvedValue`** | Faz a função falsa devolver uma Promise resolvida com o valor dado. |
| **`beforeEach` / `beforeAll`** | Código que roda antes de cada teste / uma vez antes de todos. |
| **`Test.createTestingModule`** | Monta um "mini Nest" só com as peças que o teste precisa. |
| **`useValue`** | Diz ao Nest "quando pedirem X, entregue este objeto" (o mock). |
| **Arrange, Act, Assert** | Roteiro de todo teste: preparar, executar, conferir. |

### 🏗️ Como funciona no nosso projeto
```
apps/api/
├── vitest.config.ts                roda todo arquivo *.spec.ts (globals: true = describe/it/expect sem import)
├── vitest.config.e2e.ts            roda os *.e2e-spec.ts da pasta test/ (API inteira)
└── src/
    ├── app.controller.spec.ts      teste que veio do modelo do Nest
    └── auth/auth.service.spec.ts   ← o teste desta aula (5 casos)
```

**A bancada** (`auth.service.spec.ts`):
```ts
const prismaMock = { user: { findUnique: vi.fn(), create: vi.fn() } }; // banco falso
const jwtMock = { signAsync: vi.fn().mockResolvedValue('token-falso') }; // JWT falso

beforeEach(async () => {
  vi.clearAllMocks();                       // zera o histórico dos dublês entre os testes
  jwtMock.signAsync.mockResolvedValue('token-falso');
  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,                                        // a peça REAL que vamos testar
      { provide: PrismaService, useValue: prismaMock },   // "quando pedirem PrismaService, entregue o mock"
      { provide: JwtService, useValue: jwtMock },
    ],
  }).compile();
  service = moduleRef.get(AuthService);
});
```

**Um caso completo, no roteiro Arrange → Act → Assert:**
```ts
it('lança UnauthorizedException (401) com senha errada', async () => {
  // Arrange (preparar): o "banco" responde que o usuário existe
  prismaMock.user.findUnique.mockResolvedValue(storedUser);

  // Act + Assert: chamar login com senha errada deve rejeitar com 401
  await expect(
    service.login({ email: storedUser.email, password: 'senha-errada' }),
  ).rejects.toBeInstanceOf(UnauthorizedException);

  // Assert extra: nenhum token pode ter sido gerado
  expect(jwtMock.signAsync).not.toHaveBeenCalled();
});
```

**Os 5 casos do `AuthService`:**
| Caso | O que garante |
|---|---|
| register salva o hash e devolve token | A senha nunca é gravada pura; o hash confere com `bcrypt.compare`; a resposta não tem `passwordHash`. |
| register com e-mail existente | Lança `ConflictException` (409) e **não** chama `create`. |
| login correto | Devolve o token e os dados públicos do usuário. |
| login com senha errada | Lança `UnauthorizedException` (401) e não gera token. |
| login com e-mail inexistente | Lança 401 com a **mesma** mensagem `Credenciais inválidas`. |

Repare: o **bcrypt é real** no teste. Mockamos só o que é lento ou externo (banco, assinatura de token). Assim o teste confere de verdade que a senha é embaralhada. Para ficar rápido, o hash do `beforeAll` usa custo 4 em vez de 10.

### 🧠 Conceito Teórico / Por trás dos panos
**Por que a injeção de dependências deixa tudo testável.** O `AuthService` não cria o banco sozinho (`new PrismaClient()`); ele **pede** um `PrismaService` no `constructor`. Quem entrega é o Nest. No teste, pedimos ao Nest para entregar o nosso dublê (`useValue`). O service nem percebe a troca. Se o código criasse as dependências por conta própria, não haveria onde encaixar o dublê.

**O que um `vi.fn()` registra.** Toda função falsa guarda um histórico em `.mock.calls`: com que argumentos foi chamada, quantas vezes. É assim que o teste do registro pega o que o service mandou gravar:
```ts
const saved = prismaMock.user.create.mock.calls[0][0].data; // 1ª chamada, 1º argumento, campo data
expect(saved.passwordHash).not.toBe(dto.password);           // não é a senha pura
expect(await bcrypt.compare(dto.password, saved.passwordHash)).toBe(true); // mas confere com ela
```

**`toBe` × `toEqual`.** `toBe` compara se é **o mesmo** valor (ótimo para texto, número, `true`). `toEqual` compara o **conteúdo** de objetos campo a campo: `{ a: 1 }` não é o mesmo objeto que outro `{ a: 1 }`, mas tem o mesmo conteúdo.

**Testando erros assíncronos.** Como `login` é `async`, o erro vem como Promise rejeitada. O formato é `await expect(promessa).rejects.<matcher>`. Esquecer o `await` faz o teste terminar antes da verificação e passar sempre, mesmo com bug.

**Como o Vitest entende os decorators do Nest.** O Vitest usa o Vite para transformar TypeScript em JavaScript na hora. O Nest depende de *metadata* de decorators (aula 8) para saber o que injetar; o transformador do Vite 8 lê o `emitDecoratorMetadata` do `tsconfig.json` e gera essa informação. Por isso o `Test.createTestingModule` funciona sem configuração extra.

**Isolamento entre testes.** Cada `it` deve funcionar sozinho e em qualquer ordem. O `vi.clearAllMocks()` no `beforeEach` apaga o histórico e os retornos configurados no teste anterior; sem ele, um `mockResolvedValue(storedUser)` de um teste "vazaria" para o próximo.

### 🛠️ Comandos e Operação
Todos dentro de `apps/api`:
```bash
npm test                                  # roda todos os *.spec.ts uma vez (vitest run)
npm run test:watch                        # fica observando: re-roda ao salvar um arquivo
npx vitest run src/auth                   # roda só os testes da pasta src/auth
npx vitest run -t "senha errada"          # -t: roda só os testes cujo nome contém o texto
npm run test:cov                          # mostra a cobertura: quais linhas os testes executaram
npm run test:e2e                          # testes de ponta a ponta (precisa do Postgres rodando)
```
Saída esperada do `npm test`:
```
 ✓ src/app.controller.spec.ts (1 test)
 ✓ src/auth/auth.service.spec.ts (5 tests)

 Test Files  2 passed (2)
      Tests  6 passed (6)
```

### 🧪 Experimente você mesmo
Vamos **quebrar o código de propósito** e ver o teste pegar o bug. Não precisa de Docker: o teste unitário não usa banco.

1. **Rode os testes:** `npm test`. Esperado: **6 passed**.
2. **Deixe o modo observador ligado:** `npm run test:watch`.
3. **Introduza um bug:** em `src/auth/auth.service.ts`, no `login`, troque `if (!user || !passwordOk)` por `if (!user)` e salve.
   Esperado: o Vitest re-roda sozinho e mostra ✗ em **"lança UnauthorizedException (401) com senha errada"**, com algo como `promise resolved "{ accessToken: 'token-falso', … }" instead of rejecting`. O teste acabou de impedir que uma senha errada abrisse a conta.
4. **Desfaça o bug** (volte o `|| !passwordOk`) e salve. Esperado: tudo verde de novo.
5. **Escreva um caso novo** dentro do `describe('register', ...)`:
   ```ts
   it('chama o banco procurando pelo e-mail informado', async () => {
     prismaMock.user.findUnique.mockResolvedValue(null);
     prismaMock.user.create.mockImplementation(({ data }) => Promise.resolve({ id: 'u2', ...data }));

     await service.register(dto);

     expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
   });
   ```
   Esperado: **7 passed**.
6. **Desfaça** (ou mantenha, se quiser o caso extra). Encerre o modo observador com `q`.

### ⚠️ Armadilhas Comuns
- **Teste que sempre passa.** Esquecer o `await` antes de `expect(...).rejects`. O teste termina antes da verificação. Correção: sempre `await expect(promise).rejects...`.
- **`ReferenceError: jest is not defined`.** Você copiou um exemplo da internet escrito para Jest. Correção: troque `jest.fn()` por `vi.fn()`, `jest.spyOn` por `vi.spyOn`, `jest.mock` por `vi.mock`.
- **`Nest can't resolve dependencies of the AuthService (?, JwtService)`** no teste. Faltou registrar um dublê em `providers`. Correção: `{ provide: PrismaService, useValue: prismaMock }`.
- **Testes que passam sozinhos e falham juntos.** Estado vazando entre testes. Correção: `vi.clearAllMocks()` no `beforeEach` e nada de variável alterada por um teste e lida por outro.
- **Testes lentos com bcrypt.** Custo 10 em dezenas de testes soma segundos. Correção: no teste, gere hashes com custo baixo (4).
- **Mockar demais.** Se você mocka o próprio bcrypt para "devolver true", o teste não prova mais nada sobre senhas. Mocke só o que é externo ou lento.

### 🤔 Por que usamos / Quando usar
- **Rede de segurança:** cada mudança futura no login é conferida em ~2 segundos com `npm test`.
- **Documentação executável:** os nomes dos `it` descrevem as regras de negócio ("mesma mensagem se o e-mail não existe").
- **Vitest** em vez de Jest neste projeto: já vem com o Nest CLI 12, entende ESM e TypeScript sem configuração extra, é mais rápido no modo observador e tem a mesma API do Jest (conhecimento 100% transferível para vagas que pedem Jest).

Quando outra abordagem é melhor: para conferir que **as peças conversam de verdade** (rota → guard → service → Postgres), use teste **e2e** com `supertest` (já existe `test/app.e2e-spec.ts`). Para telas do frontend, entra a **React Testing Library**; para fluxos completos no navegador, **Playwright** ou **Cypress**.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia da bancada, o que são o motor, a mangueira de teste e os medidores?</summary>

O motor é a peça testada (`AuthService`). A mangueira de teste são os mocks (Prisma e JWT falsos, que respondem o que mandarmos). Os medidores são os `expect`.
</details>

<details><summary>2. Por que o teste unitário não substitui o teste e2e?</summary>

Porque ele isola a peça: prova que a lógica do `AuthService` está certa, mas não que o Prisma grava no Postgres ou que a rota HTTP está ligada ao controller. O e2e roda tudo junto.
</details>

<details><summary>3. O que <code>{ provide: PrismaService, useValue: prismaMock }</code> diz ao Nest?</summary>

"Quando alguém pedir um `PrismaService` no constructor, entregue este objeto falso." Funciona por causa da injeção de dependências.
</details>

<details><summary>4. Por que mantivemos o bcrypt real em vez de mockar?</summary>

Porque o objetivo do teste é justamente garantir que a senha é transformada em hash e que esse hash confere. Mockar o bcrypt eliminaria essa garantia. Usamos custo baixo só para ficar rápido.
</details>

<details><summary>5. Como você converteria este teste para Jest?</summary>

Trocando `vi.fn()` por `jest.fn()` (e `vi.clearAllMocks()` por `jest.clearAllMocks()`) e configurando o Jest para TypeScript/ESM. `describe`, `it`, `expect` e os matchers são iguais.
</details>

---

## 🚀 Evolução Prática (Projeto: flowmind-ai) - Jest × Vitest: o que é igual e o que muda de verdade

> Pergunta que motivou esta seção: *"se eu aprender um, sei o outro?"* Resposta curta: **os conceitos, sim (cerca de 90%)**. O que muda é a **instalação**: como cada ferramenta lê o seu código, como se configura e como se faz mock de um módulo inteiro. É justamente aí que aparecem os erros chatos ao copiar um exemplo escrito para a outra ferramenta. Todos os comportamentos abaixo foram conferidos no próprio projeto (Vitest 4).

### O problema
Você procura "como mockar o bcrypt" na internet. A primeira resposta é de 2021, escrita para Jest. Você troca `jest.` por `vi.`, roda e... erro. Ou pior: o teste passa sem testar nada. As duas ferramentas parecem iguais por fora, e é por isso que as poucas diferenças pegam de surpresa.

**Analogia: dois carros de marcas diferentes.** Volante, pedais e regras de trânsito são os mesmos: quem dirige um, dirige o outro. Mas a alavanca do câmbio, o freio de mão e os botões do painel ficam em lugares diferentes. Nas primeiras vezes você procura o botão do pisca no lugar errado. *Onde a analogia falha:* num carro você percebe na hora que errou o botão. Num teste, algumas diferenças **não dão erro nenhum**: o teste fica verde sem ter conferido nada (veja o caso do `done` abaixo).

### Glossário novo
| Termo | Em uma frase |
|---|---|
| **CommonJS (CJS)** | O formato antigo de módulos do Node: `require()` e `module.exports`. |
| **ESM** | O formato moderno, padrão da linguagem: `import` e `export`. O nosso projeto usa ESM (`"type": "module"`). |
| **Transformar (transpilar)** | Converter TypeScript em JavaScript que o Node consegue rodar. |
| **ts-jest / Babel** | Ferramentas que o Jest usa para transformar TypeScript. |
| **Vite** | Ferramenta de build moderna; o Vitest reaproveita o jeito como ela transforma o código. |
| **Export default** | O "valor principal" de um módulo, o que vem em `import bcrypt from 'bcrypt'`. |
| **Hoisting** | Quando a ferramenta move um comando para o topo do arquivo antes de rodar; o `vi.mock` e o `jest.mock` sobem assim. |
| **Contexto do teste** | Objeto que o Vitest entrega como primeiro argumento de cada `it` (com o nome do teste, utilitários etc.). |
| **Falso positivo** | Teste que aparece como aprovado sem ter verificado o que devia. |

### O que é igual (o que você leva de um para o outro)
- **Os conceitos:** teste unitário × e2e, dublês, isolamento entre testes, roteiro Arrange → Act → Assert.
- **A escrita dos testes:** `describe`, `it`/`test`, `expect`, todos os matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`, `rejects`), `beforeEach`/`afterEach`/`beforeAll`.
- **Os dublês:** `fn()`, `spyOn()`, `mockResolvedValue()`, `mockImplementation()`, `.mock.calls`, apenas com `vi.` no lugar de `jest.`.
- **Relógios falsos** (`useFakeTimers`) e **snapshots**, com o mesmo formato.

O `auth.service.spec.ts` inteiro funcionaria no Jest trocando `vi.` por `jest.`.

### O que muda de verdade
| Ponto | Jest | Vitest | Por que importa |
|---|---|---|---|
| **Como lê o seu código** | Transforma tudo para CommonJS com `ts-jest` ou Babel. ESM só com a opção experimental `--experimental-vm-modules` | Usa o pipeline do Vite: TypeScript e ESM funcionam sem configuração | Motivo principal de o projeto usar Vitest |
| **`describe`/`it` sem import** | Já vêm prontos (globais) | Só com `globals: true` no `vitest.config.ts` (o nosso tem). Sem isso: `import { describe, it, expect, vi } from 'vitest'` | Sem a opção, um exemplo copiado dá `ReferenceError: describe is not defined` |
| **Mock de módulo com export default** | `jest.mock('bcrypt', () => ({ hash: jest.fn() }))` costuma funcionar, porque o CommonJS "embrulha" o módulo | Precisa da chave `default`: `vi.mock('bcrypt', () => ({ default: { hash: vi.fn() } }))` | Sem a chave: `Error: [vitest] No "default" export is defined on the "bcrypt" mock` |
| **Usar o módulo real dentro do mock** | `jest.requireActual('x')` responde na hora | `await vi.importActual('x')` devolve uma Promise | Sem o `await`, você recebe uma Promise no lugar do módulo |
| **Teste no estilo `done`** | `it('x', (done) => { …; done(); })` espera o `done()` | Não existe: o 1º argumento é o **contexto**. O teste termina na hora e passa; o `done()` estoura depois | Falso positivo. Use `async`/`await` |
| **Mudar o tempo limite** | `jest.setTimeout(10000)` | `vi.setConfig({ testTimeout: 10000 })` ou o 3º argumento do `it` | Exemplos antigos usam a forma do Jest |
| **Tipo de um mock no TypeScript** | `jest.Mocked<T>` | `Mocked<T>` (importado de `vitest`) | Detalhe de digitação, mas confunde |
| **Modo observador** | Roda de novo os arquivos que o Git marca como alterados | Sabe quem importa quem e roda só os testes afetados pela mudança | Vitest fica mais rápido em projetos grandes |
| **Configuração** | `jest.config.ts` próprio | `vitest.config.ts`, que aproveita a configuração do Vite (atalhos de pasta, plugins) | Um arquivo a menos para manter em projetos com Vite |
| **Extras de fábrica** | — | Testes de tipos (`expectTypeOf`), painel visual (`@vitest/ui`), modo navegador | Coisas que o Jest não traz |

### Por trás dos panos: a diferença que explica todas as outras
Quase todas as linhas da tabela vêm de **um único ponto**: o formato de módulo com que cada ferramenta trabalha.

```
Jest:    seu .ts (ESM) ──ts-jest/Babel──► JavaScript CommonJS ──► roda num "sandbox" do Node
                                           (import vira require; o módulo é um objeto só)

Vitest:  seu .ts (ESM) ──Vite (oxc)─────► JavaScript ESM ───────► roda como ESM de verdade
                                           (export default e exports nomeados são coisas separadas)
```
- No **CommonJS**, um módulo é um objeto só (`module.exports`). Por isso, no Jest, `import bcrypt from 'bcrypt'` e `{ hash }` acabam apontando para o mesmo objeto, e o mock "sem default" funciona.
- No **ESM**, o `export default` é uma "gaveta" separada dos exports nomeados. O Vitest respeita isso, então o mock precisa preencher a gaveta `default`.
- O `importActual` é assíncrono porque, no ESM, carregar um módulo é assíncrono por natureza (o `import()` dinâmico devolve uma Promise). No CommonJS, o `require` é síncrono.

### Experimente: mockar demais faz o teste mentir
Este exercício junta uma diferença de ferramenta (a chave `default`) com a regra "mocke só o que é externo".

1. **Abra** `apps/api/src/auth/auth.service.spec.ts`.
2. **Mocke o bcrypt sem `default`:** logo abaixo dos `import`, acrescente:
   ```ts
   vi.mock('bcrypt', () => ({ hash: vi.fn(), compare: vi.fn() }));
   ```
   Rode `npm test`. Esperado: `Error: [vitest] No "default" export is defined on the "bcrypt" mock. Did you forget to return it from "vi.mock"?`
3. **Corrija com a chave `default`**, fazendo o bcrypt falso sempre dizer "senha certa":
   ```ts
   vi.mock('bcrypt', () => ({
     default: {
       hash: vi.fn().mockResolvedValue('hash-falso'), // "embaralha" qualquer senha para o mesmo texto
       compare: vi.fn().mockResolvedValue(true),       // diz que QUALQUER senha confere
     },
   }));
   ```
   Rode `npm test`. Esperado: **`Tests 1 failed | 4 passed (5)`** no arquivo, com ✗ em *"lança UnauthorizedException (401) com senha errada"*.
4. **Leia o resultado com atenção:**
   - O teste de **registro continua verde**, mas agora não prova nada: o `passwordHash` salvo é `'hash-falso'` e o `compare` diria "confere" para qualquer texto.
   - O teste de **senha errada quebrou**, porque o `compare` falso diz que toda senha está certa. Ele estava testando justamente o que você substituiu.
   - Lição: ao mockar a peça que é o **assunto** do teste, o teste deixa de medir o que importa. O bcrypt é rápido o bastante (com custo 4) e é o coração da regra; por isso ele fica real.
5. **Desfaça:** apague o `vi.mock(...)` e rode `npm test`. Esperado: **`Tests 6 passed (6)`**.

### Armadilhas novas
- **`Error: [vitest] No "default" export is defined on the "X" mock`.** O código usa `import X from 'x'` e o mock não tem a chave `default`. Correção: `vi.mock('x', () => ({ default: { … } }))`.
- **Teste com `done` que "passa", mas aparece `Errors 1 error` no rodapé** com `done() callback is deprecated, use promise instead`. O Vitest não espera o `done`. Correção: transforme o teste em `async` e use `await`. **Nunca ignore o contador `Errors` no fim da saída**: o próprio Vitest avisa que ele *"might cause false positive tests"*.
- **`ReferenceError: describe is not defined`** num projeto Vitest. Falta `globals: true` no `vitest.config.ts` ou o `import { describe, it, expect } from 'vitest'`.
- **Mock "parcial" recebendo uma Promise.** Faltou o `await` em `vi.importActual()`. O formato certo:
  ```ts
  vi.mock('bcrypt', async () => {
    const real = await vi.importActual<typeof import('bcrypt')>('bcrypt');
    return { default: { ...real, hash: vi.fn() } }; // só o hash é falso; o resto é o bcrypt real
  });
  ```

### Quando escolher cada um
- **Vitest:** projetos novos, com ESM, TypeScript ou Vite (o nosso caso). Menos configuração e modo observador mais rápido.
- **Jest:** projetos que já usam Jest (trocar só por trocar raramente compensa), **React Native** (o padrão do ecossistema) e projetos Nest mais antigos, criados com o Jest de fábrica. Tem mais respostas prontas na internet.
- **No currículo e em entrevista:** diga que sabe "testes unitários com Jest/Vitest". É verdade: os conceitos são os mesmos, e agora você sabe também onde os dois diferem.

### Teste seu entendimento (evolução)
<details><summary>6. Se você aprende Vitest, sabe Jest?</summary>

Os conceitos e a escrita dos testes, sim (cerca de 90%): `describe`, `it`, `expect`, matchers e dublês, trocando `vi.` por `jest.`. O que muda é a configuração, o jeito de cada um ler o código (CommonJS × ESM) e detalhes do mock de módulos.
</details>

<details><summary>7. Por que o <code>vi.mock</code> do bcrypt precisa da chave <code>default</code> e o do Jest geralmente não?</summary>

Porque o Vitest roda ESM de verdade, onde o `export default` é separado dos exports nomeados. O Jest transforma tudo em CommonJS, onde o módulo é um objeto só, e o `import bcrypt from` acaba apontando para esse mesmo objeto.
</details>

<details><summary>8. Um teste com <code>(done) =&gt; …</code> aparece como aprovado no Vitest. Por que isso é perigoso?</summary>

Porque o Vitest não espera o `done`: o 1º argumento é o contexto do teste, e o teste termina antes do código assíncrono rodar. É um falso positivo. O único sinal é o `Errors 1 error` no rodapé. Use `async`/`await`.
</details>

<details><summary>9. No exercício, por que mockar o bcrypt inteiro fez o teste de senha errada quebrar e o de registro perder o sentido?</summary>

O `compare` falso dizia que qualquer senha confere, então o login nunca recusava. O `hash` falso salvava sempre `'hash-falso'`, então o teste de registro não provava mais que a senha é embaralhada. Mockamos o próprio assunto do teste.
</details>
