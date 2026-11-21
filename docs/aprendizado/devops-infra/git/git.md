# 🎓 Aula: Git, .gitignore e Conventional Commits
> **Categoria:** `devops-infra` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 11 de 11 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/DwSyKTh3ziTrpTNcWVJdGK) · arquivo local [`git.html`](./git.html)

### 📚 Antes de começar (pré-requisitos)
- **Nenhuma aula anterior é obrigatória.** Ajuda ter visto a estrutura do projeto nas aulas 4 ([Docker Compose](../docker-compose/docker-compose.md)) e 6 ([NestJS](../../backend/nestjs/nestjs.md)), porque os commits contam a história delas.
- **Terminal (em poucas linhas):** janela onde você digita comandos em vez de clicar. No VS Code: menu *Terminal → New Terminal*. Todo comando desta aula roda ali, dentro da pasta `flowmind-ai`.
- **Variável de ambiente / `.env` (em poucas linhas):** arquivo com configurações secretas, como a senha do banco (`POSTGRES_PASSWORD=...`). Ele existe no seu computador e **nunca** deve ir para a internet.

### 🎯 O que é e qual problema resolve
**O problema.** Sem controle de versão, o projeto vive numa pasta só. Você muda o login, quebra tudo, e não lembra como estava ontem. Para "guardar uma cópia", cria `flowmind-final`, `flowmind-final-2`, `flowmind-agora-vai`. Se o notebook estragar, perde tudo. E quando um recrutador abre seu portfólio, não vê **como** você construiu o projeto, só o resultado.

**A solução.** O **Git** é um programa que tira **fotos** (commits) do projeto sempre que você manda, guarda todas numa pasta escondida (`.git`) e deixa voltar a qualquer foto. Cada foto tem uma **mensagem** dizendo o que mudou. Junto com ele usamos:
- **`.gitignore`**: a lista do que **não** entra nas fotos (senhas, `node_modules`, arquivos gerados).
- **Conventional Commits**: um padrão para escrever as mensagens (`feat(api): adiciona login`), que deixa o histórico legível por pessoas e por ferramentas.

**Analogia: o álbum de fotos de uma reforma.**
- O **projeto** é a casa em reforma.
- Um **commit** é uma **foto datada com legenda**: "instalei a parte elétrica da cozinha". O álbum é o **histórico**.
- A **área de preparação** (*staging*) é o **enquadramento**: antes de clicar, você escolhe o que aparece na foto. Dá para fotografar só a cozinha, deixando a sala bagunçada de fora.
- O **`.gitignore`** é a regra "não fotografe o cofre nem o lixo": o cofre (o `.env` com senhas) nunca aparece em foto nenhuma; o lixo (`node_modules`, `dist`) dá para refazer a qualquer hora.
- **Conventional Commits** é o **padrão das legendas**: toda legenda começa dizendo o tipo de serviço ("elétrica:", "pintura:"), então dá para achar rapidinho "todas as fotos de elétrica".

*Onde a analogia falha:* uma foto de verdade guarda a casa inteira de novo. O Git é mais esperto: se um arquivo não mudou entre duas fotos, ele guarda só **uma** cópia e as duas fotos apontam para ela. Por isso centenas de commits ocupam pouco espaço.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Controle de versão** | Sistema que guarda o histórico de mudanças de arquivos e permite voltar a qualquer ponto. |
| **Git** | O programa de controle de versão mais usado no mundo; roda no seu computador. |
| **Repositório (repo)** | Uma pasta controlada pelo Git; o histórico fica na subpasta escondida `.git`. |
| **Working tree (pasta de trabalho)** | Os arquivos como estão agora na sua pasta, do jeito que você edita. |
| **Staging (área de preparação / index)** | Onde você monta o que vai entrar no próximo commit, com `git add`. |
| **Commit** | Uma "foto" do projeto, com mensagem, autor, data e um código único (hash). |
| **Hash** | Código como `d0eca83` que identifica um commit (a versão curta dos 40 caracteres reais). |
| **Branch** | Uma linha do histórico com nome; a principal aqui se chama `main`. |
| **`.gitignore`** | Arquivo com os padrões de nomes que o Git deve ignorar. |
| **Untracked** | Arquivo que o Git vê na pasta mas que ainda não faz parte do histórico (`??` no status). |
| **Conventional Commits** | Padrão de mensagem: `tipo(escopo): descrição`. |
| **Escopo** | A parte do projeto afetada, entre parênteses: `(api)`, `(infra)`. |
| **Remoto** | Uma cópia do repositório num servidor, como o GitHub. Recebe seus commits com `git push`. |
| **LF / CRLF** | Os dois jeitos de marcar "fim de linha": Linux/macOS usam LF, Windows usa CRLF. |
| **Blob** | Como o Git chama, por dentro, o conteúdo de um arquivo guardado. |

### 🏗️ Como funciona no nosso projeto
O repositório foi criado na **raiz do monorepo**, para que um único histórico cubra a infraestrutura, a API, os futuros `apps/web` e `packages/`, e as aulas:
```
flowmind-ai/
├── .git/               o histórico (pasta escondida; nunca edite à mão)
├── .gitignore          o que NÃO vai para o histórico
├── docker-compose.yml  ┐
├── .env.example        ┘ commit 1
├── .env                ← ignorado (senhas reais)
├── packages/           ┐
├── apps/api/           ┘ commits 2 e 3 (node_modules, dist, .env e src/generated ignorados)
└── docs/aprendizado/   commit 4
```

**O `.gitignore` da raiz** (os padrões sem `/` no início valem em qualquer pasta):
```gitignore
node_modules/            # dependências: recriadas com `npm install`
.env                     # senhas e segredos...
.env.*                   # ...inclusive .env.local, .env.production...
!.env.example            # ...EXCETO o modelo, que deve ir para o Git (o "!" desfaz a regra)
dist/                    # saída do build: recriada com `npm run build`
.next/                   # build do Next.js (o futuro apps/web)
*.tsbuildinfo            # cache do compilador TypeScript
coverage/                # relatório de cobertura de testes
apps/api/src/generated/  # Prisma Client: recriado com `npm run prisma:generate`
```
Regra prática: **ignore o que é segredo ou o que dá para recriar com um comando.**

**O histórico que criamos** (`git log --oneline`):
```
cb05c5f docs: adiciona trilha de aprendizado do projeto (aulas 1 a 10)
81d9cc7 feat(api): adiciona autenticação JWT e CRUD de tarefas
38da548 feat(api): cria API NestJS com Prisma e PostgreSQL
d0eca83 chore(infra): configura PostgreSQL e Redis com Docker Compose
```
Lido de baixo para cima, ele conta a ordem real em que o FlowMind foi construído: Fase 1 (Docker), Fase 2 (API + banco), Fase 3 (login e tarefas) e as aulas.

**Anatomia de uma mensagem** (Conventional Commits):
```
feat(api): adiciona autenticação JWT e CRUD de tarefas     ← título: tipo(escopo): descrição
                                                           ← linha em branco obrigatória
- POST /auth/register e /auth/login com bcrypt ...          ← corpo: o quê e por quê
- CRUD /tasks protegido e filtrado por userId ...

Co-Authored-By: ...                                        ← rodapé (opcional)
```
| Tipo | Quando usar | Exemplo no FlowMind |
|---|---|---|
| `feat` | funcionalidade nova para quem usa | `feat(api): adiciona autenticação JWT` |
| `fix` | correção de bug | `fix(api): impede ler tarefa de outro usuário` |
| `docs` | só documentação | `docs: adiciona aula de Git` |
| `chore` | manutenção/configuração, sem mudar comportamento | `chore(infra): configura Docker Compose` |
| `refactor` | reorganiza código sem mudar o que ele faz | `refactor(api): extrai toData do TasksService` |
| `test` | só testes | `test(api): cobre login com e-mail inexistente` |
| `ci`, `build`, `perf`, `style` | pipeline, build/dependências, desempenho, formatação | `ci: roda testes no GitHub Actions` |

A descrição fica em **português** (escolha do projeto) e no **imperativo/presente** ("adiciona", "corrige"), curta, sem ponto final. O tipo é sempre em inglês, porque é o padrão que as ferramentas entendem.

### 🧠 Conceito Teórico / Por trás dos panos
**As três áreas.** Todo arquivo transita entre três lugares:
```
 pasta de trabalho  ──git add──►  staging (index)  ──git commit──►  histórico (.git)
 (o que você edita)              (a foto montada)                   (as fotos tiradas)
```
`git status` mostra a diferença entre elas: `??` = o Git ainda não conhece; `A` = preparado e novo; `M` = modificado. Uma letra na **1ª coluna** está no staging; na **2ª coluna**, só na pasta.

**O que é um commit por dentro.** O Git guarda cada conteúdo de arquivo como um **blob**, identificado por um código calculado a partir do próprio conteúdo (o hash). Uma pasta vira uma **árvore** que lista os blobs. Um **commit** aponta para uma árvore, para o commit anterior (o "pai") e guarda autor, data e mensagem. Como o código vem do conteúdo, dois arquivos iguais viram o mesmo blob, e qualquer alteração no passado mudaria todos os códigos seguintes. Por isso o histórico é confiável.

**O staging pode diferir da pasta.** O commit 2 precisava mostrar a API **como era na Fase 2**, mas a pasta já estava na Fase 3 (com login no `main.ts`, `app.module.ts`, `package.json` etc.). Em vez de desfazer o trabalho na pasta, colocamos as versões antigas **direto no staging**:
```bash
blob=$(git hash-object -w --path=apps/api/src/main.ts /tmp/main-fase2.ts)  # guarda o conteúdo antigo como blob e devolve o hash
git update-index --cacheinfo 100644,$blob,apps/api/src/main.ts              # diz ao staging: "main.ts deste commit = esse blob"
```
Depois do commit 2, o `git status` mostrou os 5 arquivos como `M` (modificados), porque a pasta tinha a versão da Fase 3. O commit 3 só precisou de `git add`. São comandos avançados (*plumbing*, "encanamento" do Git). No dia a dia, o equivalente é **commitar com frequência**, para nunca precisar reconstruir o passado. Antes de gravar, extraímos o staging para uma pasta temporária (`git checkout-index -a --prefix=...`) e rodamos `tsc` e os testes nela, para provar que aquele commit funciona sozinho.

**Por que o `.gitignore` não "esconde" o que já foi commitado.** Ele só vale para arquivos *untracked*. Se um `.env` já entrou num commit, colocá-lo no `.gitignore` depois não o apaga do histórico, e quem clonar o repositório ainda consegue ver a senha nas fotos antigas. Por isso conferimos **antes** do primeiro commit e fizemos uma varredura nas aulas procurando os valores reais das senhas.

**LF × CRLF no Windows.** O Git para Windows vem com `core.autocrlf=true`: guarda os arquivos com LF no repositório e entrega com CRLF na sua pasta. Os avisos `LF will be replaced by CRLF` são só esse lembrete, não um erro. O `apps/api/.gitattributes` (`* text=auto eol=lf`) força LF naquela pasta, que é o que o Prettier e o lint esperam.

### 🛠️ Comandos e Operação
```bash
git init -b main                     # transforma a pasta atual em repositório; -b main dá o nome "main" à branch principal
git status                           # mostra o que mudou e o que está preparado (rode sempre!)
git status --ignored                 # mostra também o que o .gitignore está ignorando (linhas com !!)
git check-ignore -v .env             # explica QUAL regra de QUAL .gitignore ignora um arquivo
git ls-files --others --exclude-standard   # lista o que ENTRARIA num `git add .` (não ignorados e não versionados)

git add docker-compose.yml .env.example    # prepara arquivos específicos para o próximo commit
git add apps/api ':!apps/api/src/auth'     # prepara uma pasta, EXCETO um caminho (o ':!' exclui)
git diff                             # o que mudou na pasta e ainda NÃO foi preparado
git diff --cached                    # o que JÁ está preparado (vai entrar no commit)
git restore --staged arquivo         # tira um arquivo da preparação, sem perder a edição

git commit -m "feat(api): adiciona login"  # tira a foto com uma mensagem de uma linha
git commit                           # abre o editor para escrever título + corpo

git log --oneline                    # histórico resumido: hash curto + título
git log --stat                       # histórico com os arquivos alterados em cada commit
git show 81d9cc7                     # detalhes e diferenças de um commit específico
git ls-files                         # tudo o que está versionado hoje
```
Saída de `git status --ignored` no FlowMind antes do primeiro commit:
```
!! .env
!! apps/api/.env
!! apps/api/dist/
!! apps/api/node_modules/
!! apps/api/src/generated/
!! apps/api/tsconfig.build.tsbuildinfo
```

### 🧪 Experimente você mesmo
Vamos treinar numa **pasta separada**, para não mexer no histórico real do FlowMind.

1. **Crie a pasta de treino** (fora do projeto):
   ```bash
   mkdir ~/treino-git && cd ~/treino-git   # ~ é a sua pasta de usuário
   git init -b main
   ```
   Esperado: `Initialized empty Git repository in .../treino-git/.git/`
2. **Crie um "segredo" e um arquivo normal:**
   ```bash
   echo "SENHA=123" > .env
   echo "# Meu treino" > README.md
   git status
   ```
   Esperado: os dois aparecem em `Untracked files`. O `.env` está prestes a vazar!
3. **Proteja o segredo:**
   ```bash
   echo ".env" > .gitignore
   git status --ignored
   ```
   Esperado: `README.md` e `.gitignore` em *Untracked*, e `.env` em *Ignored files*.
4. **Primeiro commit, preparando arquivo por arquivo:**
   ```bash
   git add .gitignore
   git commit -m "chore: ignora arquivos .env"
   git add README.md
   git commit -m "docs: adiciona README"
   git log --oneline
   ```
   Esperado: dois commits, o mais novo em cima.
5. **Veja o staging diferente da pasta:**
   ```bash
   echo "linha nova" >> README.md
   git add README.md
   echo "outra linha" >> README.md
   git status
   ```
   Esperado: `README.md` aparece **duas vezes**: em *Changes to be committed* (com "linha nova") e em *Changes not staged* (com "outra linha"). Confira com `git diff --cached` e `git diff`.
6. **Prove que o `.gitignore` não protege o passado:** `git add -f .env` (o `-f` força) e `git commit -m "chore: oops"`. Depois rode `git show HEAD:.env`. Esperado: `SENHA=123`. A senha agora está no histórico, mesmo com o `.gitignore`.
7. **Desfaça tudo:** como é só treino, apague a pasta inteira: `cd ~ && rm -rf ~/treino-git`. Num projeto real, um segredo commitado deve ser **trocado** (gere outra senha), porque não dá para ter certeza de que ninguém o viu.

### ⚠️ Armadilhas Comuns
- **Commitar o `.env`.** Sintoma: a senha aparece no GitHub. Correção: `.env` no `.gitignore` **antes** do primeiro commit; se já vazou, troque a senha e limpe o histórico (ferramentas como `git filter-repo`).
- **Commitar `node_modules`.** Sintoma: milhares de arquivos no `git status`, push de centenas de MB. Correção: `node_modules/` no `.gitignore`; se já entrou, `git rm -r --cached node_modules` e commit.
- **`.gitignore` "não funciona".** Causa: o arquivo já estava versionado. Correção: `git rm --cached arquivo` (tira do Git sem apagar da pasta) e commit. Use `git check-ignore -v arquivo` para investigar.
- **`fatal: not a git repository`.** Você está fora da pasta do repositório. Correção: `cd` para `flowmind-ai`.
- **`Author identity unknown` / `Please tell me who you are`.** O Git não sabe seu nome. Correção: `git config --global user.name "Seu Nome"` e `git config --global user.email "seu@email"`.
- **Repositório dentro de repositório.** `git init` em `apps/api` e de novo na raiz cria um "repositório aninhado" que o de fora não versiona direito. No FlowMind há um só, na raiz (conferimos com `git rev-parse --show-toplevel` antes).
- **Commits gigantes e mensagens vagas** (`"update"`, `"ajustes"`). O histórico deixa de contar a história. Faça commits pequenos, um assunto por commit, no padrão `tipo(escopo): descrição`.
- **Achar que os avisos LF/CRLF são erro.** São avisos do Windows; o commit foi feito normalmente.

### 🤔 Por que usamos / Quando usar
- **Sempre.** Todo projeto de software, até o menor, deve ter Git desde o primeiro dia.
- **Portfólio:** o histórico mostra a recrutadores como você pensa e evolui o projeto, não só o resultado final.
- **Rede de segurança:** qualquer experimento pode ser desfeito voltando a um commit.
- **Conventional Commits** compensa quando o histórico vai ser lido por outras pessoas ou ferramentas: dá para gerar *changelog* (lista de novidades) e versão (`feat` → versão nova, `fix` → correção) automaticamente, e é exigido em muitas empresas e projetos open source.

Alternativas: SVN e Mercurial ainda existem em empresas antigas, mas o Git domina o mercado. Para as mensagens, algumas equipes usam padrões próprios (Gitmoji, prefixos com o número da tarefa: `FLOW-42: ...`); o Conventional Commits é o mais difundido. **Próximo passo do FlowMind:** criar o repositório no GitHub e enviar os commits com `git push`, o que pede uma aula sobre remotos e GitHub.

### ✅ Teste seu entendimento
<details><summary>1. Na analogia da reforma, o que são o commit, o staging e o <code>.gitignore</code>?</summary>

Commit = foto datada com legenda. Staging = o enquadramento, onde você escolhe o que entra na foto. `.gitignore` = a regra "não fotografe o cofre (senhas) nem o lixo (o que dá para recriar)".
</details>

<details><summary>2. Por que <code>node_modules</code> e <code>dist</code> ficam fora do Git, mas o <code>package-lock.json</code> entra?</summary>

`node_modules` e `dist` são recriados com `npm install` e `npm run build`. O `package-lock.json` é justamente a "receita" que faz o `npm install` recriar **exatamente** as mesmas versões em outra máquina.
</details>

<details><summary>3. Por que a regra <code>!.env.example</code> vem depois de <code>.env.*</code>?</summary>

`.env.*` ignoraria também o `.env.example`. O `!` desfaz a regra para esse arquivo, e no `.gitignore` a última regra que combina é a que vale. O modelo sem segredos precisa ir para o Git, para quem clonar saber quais variáveis criar.
</details>

<details><summary>4. Classifique: "adiciona rota de tarefas", "corrige 500 no GET /tasks/abc", "atualiza a aula de Prisma".</summary>

`feat(api): adiciona rota de tarefas` · `fix(api): retorna 400 para id que não é UUID` · `docs: atualiza aula de Prisma`.
</details>

<details><summary>5. Colocar um arquivo no <code>.gitignore</code> depois de commitá-lo protege a senha que estava nele?</summary>

Não. O `.gitignore` só vale para arquivos ainda não versionados, e o commit antigo continua guardando a senha. É preciso trocar a senha e, se necessário, limpar o histórico.
</details>
