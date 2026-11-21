# 🎓 Aula: Docker Compose (do zero)
> **Categoria:** `devops-infra` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 4 de 4 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/4crb5Jt9ChQTgeKiDhAW3d) · arquivo local [`docker-compose.html`](./docker-compose.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 1: [Docker](../docker/docker.md):** imagem, container, porta e volume.
- **Aula 2: [PostgreSQL](../../databases/postgresql/postgresql.md)** e **Aula 3: [Redis](../../databases/redis/redis.md):** os dois programas que o Compose vai ligar.
- **Variável de ambiente:** um par `NOME=valor` que um programa lê ao iniciar, para se configurar sem mudar o código. Exemplo: `POSTGRES_PASSWORD=abc123` diz ao PostgreSQL qual senha usar.
- **YAML:** o formato do arquivo do Compose. Três regras bastam:
  ```yaml
  chave: valor          # um par nome → valor
  pai:                  # "filhos" ficam recuados com ESPAÇOS (nunca TAB)
    filho: valor
  lista:
    - item 1            # itens de lista começam com "-"
    - item 2
  ```

### 🎯 O que é e qual problema resolve
**O problema.** Só com o Docker da aula 1, para ligar o banco e o cache do FlowMind você teria que digitar, toda vez, dois comandos enormes:
```bash
docker volume create postgres_data
docker run -d --name flowmind-postgres --restart unless-stopped \
  -e POSTGRES_USER=flowmind -e POSTGRES_PASSWORD=... -e POSTGRES_DB=flowmind \
  -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:16-alpine

docker volume create redis_data
docker run -d --name flowmind-redis --restart unless-stopped \
  -p 6379:6379 -v redis_data:/data redis:7-alpine \
  redis-server --appendonly yes --requirepass ...
```
É fácil errar uma letra, esquecer uma opção ou digitar diferente do colega.

**A solução.** O **Docker Compose** deixa você escrever tudo isso **uma vez**, num arquivo chamado `docker-compose.yml`, e depois ligar tudo com um único comando: `docker compose up -d`. O arquivo vira a documentação oficial de "do que este projeto precisa para rodar".

**Analogia: a partitura do maestro.** Sem o Compose, você vai até cada músico e explica o que tocar, um por um, toda vez. Com o Compose, você escreve uma **partitura** (o `docker-compose.yml`) e entrega ao **maestro** (o comando `docker compose`), que coordena todos os músicos (containers) de uma vez: quem entra, em que porta, com quais instrumentos (volumes).

*Onde a analogia falha:* o maestro não espera um músico terminar para chamar o outro. Por padrão o Compose liga todos ao mesmo tempo, a não ser que você diga que um depende do outro (`depends_on`).

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Docker Compose** | Ferramenta que liga vários containers a partir de um arquivo. |
| **docker-compose.yml** | O arquivo, em YAML, que descreve os containers do projeto. |
| **Serviço** | Cada item dentro de `services:` (aqui: `postgres` e `redis`). Vira um container. |
| **YAML** | Formato de texto baseado em recuo (indentação) com espaços. |
| **Variável de ambiente** | Configuração `NOME=valor` que o programa lê ao iniciar. |
| **`.env`** | Arquivo com as variáveis de ambiente do projeto, incluindo as senhas. Não vai para o Git. |
| **`.env.example`** | Modelo do `.env` sem as senhas reais. Vai para o Git. |
| **Interpolação** | Trocar `${NOME}` no YAML pelo valor que está no `.env`. |
| **Rede (network)** | Ligação interna criada pelo Compose, onde os containers se acham pelo nome do serviço. |
| **Volume nomeado** | Volume com nome (`postgres_data`), gerenciado pelo Docker, onde os dados persistem. |
| **Healthcheck** | Teste que o Docker roda de tempos em tempos para saber se o serviço está *pronto*. |
| **Restart policy** | Regra de quando o Docker deve religar um container que parou. |
| **`-d` (detached)** | Rodar em segundo plano, devolvendo o terminal para você. |

### 🏗️ Como funciona no nosso projeto
Arquivos na raiz do `flowmind-ai/`:

| Arquivo | Papel |
|---|---|
| `docker-compose.yml` | Descreve os serviços `postgres` e `redis`: imagem, portas, volumes, healthchecks |
| `.env` | Senhas reais (geradas aleatoriamente). **Fica fora do Git** |
| `.env.example` | Modelo do `.env` sem segredos. Esse vai para o Git |
| `.gitignore` | Lista do que o Git deve ignorar. Inclui o `.env` |

O que acontece quando você roda `docker compose up -d`:
1. O Compose lê o `.env` e troca cada `${...}` do YAML pelo valor correspondente.
2. Cria a **rede** `flowmind-ai_default`.
3. Cria os **volumes** `postgres_data` e `redis_data`, se ainda não existirem.
4. Baixa as **imagens**, se ainda não estiverem no PC.
5. Cria e liga os **containers** `flowmind-postgres` e `flowmind-redis`.
6. O Docker começa a rodar os **healthchecks**. Em uns 10 segundos, os dois aparecem como `healthy`.

O arquivo, com cada linha explicada:
```yaml
name: flowmind-ai                    # nome do projeto; vira prefixo da rede e dos volumes

services:                            # a lista de containers
  postgres:                          # nome do serviço (também é o "endereço" dele na rede interna)
    image: postgres:16-alpine        # imagem oficial, versão 16, base Alpine
    container_name: flowmind-postgres  # nome fixo do container
    restart: unless-stopped          # religa sozinho se cair, a não ser que você tenha parado
    environment:                     # variáveis de ambiente passadas ao PostgreSQL
      POSTGRES_USER: ${POSTGRES_USER}        # o valor vem do .env
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"  # porta do Windows : porta do container (5432 se não houver no .env)
    volumes:
      - postgres_data:/var/lib/postgresql/data  # onde o PostgreSQL grava → fica no volume
    healthcheck:                     # como saber se está pronto
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s                  # testa a cada 10 segundos
      timeout: 5s                    # se demorar mais que 5s, conta como falha
      retries: 5                     # 5 falhas seguidas = unhealthy

  redis:
    image: redis:7-alpine
    container_name: flowmind-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    #         liga o Redis com AOF (persistência) e exigindo senha
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data             # onde o Redis grava o diário AOF
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \"$$REDIS_PASSWORD\" --no-auth-warning ping | grep PONG"]
      interval: 10s
      timeout: 5s
      retries: 5
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}  # deixa a senha disponível para o healthcheck acima

volumes:                             # declara os volumes usados acima
  postgres_data:
  redis_data:
```

### 🧠 Conceito Teórico / Por trás dos panos
- **Por que fixar `16-alpine` e não `latest`:** `16` trava a versão principal. Você recebe correções (16.15, 16.16...) ao rodar `docker compose pull`, mas nunca pula para a 17 sem querer. Isso importa porque os arquivos de dados da 16 não abrem na 17 sem uma migração.
- **Volumes e o ciclo de vida:** containers e rede são descartáveis, e o Compose recria tudo a partir do YAML. Os volumes são a única parte que guarda algo que não dá para recriar. Por isso `docker compose down` apaga containers e rede, mas mantém os volumes.
- **A rede interna:** dentro da rede `flowmind-ai_default`, um container acha o outro pelo **nome do serviço**. Se a API rodar como container no futuro, ela vai conectar em `postgres:5432`, e não em `localhost:5432`. Do Windows, você usa `localhost` porque as portas foram publicadas em `ports:`.
- **`${VAR}` vs. `$$VAR`:** `${VAR}` é trocado pelo Compose, lendo o `.env`, *antes* de criar o container. `$$VAR` vira um `$VAR` literal, que só é lido *dentro* do container, pelo shell que roda o healthcheck.
- **Healthcheck:** "container ligado" não é "banco pronto". O PostgreSQL leva alguns segundos para aceitar conexões depois de ligar. O status passa de `starting` para `healthy` quando o teste dá certo. Na Fase 2, a API vai usar `depends_on: condition: service_healthy` para só ligar depois disso.
- **`restart: unless-stopped`:** se o container cair ou o Docker Desktop reiniciar, ele volta sozinho. Se *você* parou com `docker compose stop`, ele respeita e fica parado.

### 🛠️ Comandos e Operação
Rode sempre dentro da pasta `flowmind-ai/`:
```bash
cp .env.example .env            # 1ª vez: cria o .env a partir do modelo (depois edite as senhas)

docker compose up -d            # liga tudo em segundo plano
docker compose ps               # mostra cada serviço e se está (healthy)
docker compose logs -f postgres # acompanha as mensagens do PostgreSQL ao vivo (Ctrl+C sai)
docker compose stop             # desliga, sem apagar nada
docker compose start            # liga de novo
docker compose down             # apaga containers e rede (os VOLUMES ficam)
docker compose down -v          # ⚠️ apaga também os volumes = APAGA OS DADOS
docker compose pull             # baixa correções novas das mesmas versões
docker compose config           # mostra o YAML final, já com os valores do .env
```

Endereços para conectar a partir do Windows (troque `SENHA` pelos valores do `.env`):
```
postgresql://flowmind:SENHA@localhost:5432/flowmind
redis://:SENHA@localhost:6379
```

### 🧪 Experimente você mesmo
Vamos provar que os dados sobrevivem quando os containers são apagados.

1. **Veja o estado atual.**
   ```bash
   docker compose ps
   ```
   Esperado: os dois serviços `Up ... (healthy)`.

2. **Guarde um valor no Redis** (troque `SENHA` pelo `REDIS_PASSWORD` do `.env`).
   ```bash
   docker exec flowmind-redis redis-cli -a SENHA --no-auth-warning SET prova:volume "sobrevivi"
   ```
   Esperado: `OK`.

3. **Apague os containers e a rede.**
   ```bash
   docker compose down
   docker ps -a
   ```
   Esperado: nenhum container `flowmind-*` na lista.

4. **Ligue tudo de novo e leia o valor.**
   ```bash
   docker compose up -d
   docker exec flowmind-redis redis-cli -a SENHA --no-auth-warning GET prova:volume
   ```
   Esperado: `"sobrevivi"`. Os containers são novos, mas o volume `redis_data` é o mesmo.

5. **Veja o YAML com as variáveis já trocadas.**
   ```bash
   docker compose config
   ```
   Repare que `${POSTGRES_USER}` virou `flowmind`. (Cuidado: a saída mostra as senhas, não compartilhe.)

6. **Desfaça o teste.**
   ```bash
   docker exec flowmind-redis redis-cli -a SENHA --no-auth-warning DEL prova:volume
   ```

### ⚠️ Armadilhas Comuns
- **Rodar fora da pasta do projeto.** Sintoma: `no configuration file provided: not found`. Correção: `cd` até a pasta `flowmind-ai/`.
- **TAB no YAML.** Sintoma: `found character that cannot start any token`. Correção: troque TABs por espaços.
- **Recuo errado no YAML.** Uma chave com dois espaços a mais ou a menos muda de "pai" e o Compose reclama ou ignora a configuração.
- **Porta ocupada.** Sintoma: `port is already allocated` (por exemplo, um PostgreSQL instalado no Windows). Correção: mude `POSTGRES_PORT=5433` no `.env`; a porta de dentro do container continua 5432.
- **Trocar a senha no `.env` depois do primeiro `up`.** O PostgreSQL só lê `POSTGRES_PASSWORD` quando o volume está vazio, na primeira vez. Depois disso, troque com `ALTER USER` dentro do `psql`.
- **`down -v` por engano.** Apaga o banco inteiro. Leia duas vezes antes de rodar.
- **Commitar o `.env`.** As senhas vazam. Por isso existem o `.env.example` e o `.gitignore`.
- **Usar `localhost` dentro de um container.** Ali, `localhost` é o próprio container. Use o nome do serviço (`postgres`, `redis`).

### 🤔 Por que usamos / Quando usar
- **Ambiente de desenvolvimento** com vários programas de apoio (banco, cache, fila): exatamente o caso do FlowMind.
- **Qualquer pessoa roda o projeto com um comando.** Importante em portfólio: quem avaliar o projeto não precisa instalar PostgreSQL nem Redis.
- **O arquivo documenta a infraestrutura.** Ler o `docker-compose.yml` mostra do que o projeto precisa.

Quando não é a melhor escolha: em produção com várias máquinas, necessidade de escalar automaticamente e alta disponibilidade. Aí entram Kubernetes ou serviços gerenciados (bancos e caches oferecidos prontos por empresas de nuvem). O Compose brilha no desenvolvimento local, em testes automatizados e em servidores simples.

### ✅ Teste seu entendimento
<details><summary>1. O que o Compose faz que o Docker sozinho não faz?</summary>

Ele lê um arquivo com a descrição de vários containers (com portas, volumes e variáveis) e liga, desliga ou apaga todos juntos com um comando, sempre do mesmo jeito.
</details>

<details><summary>2. Depois de <code>docker compose down</code>, o banco de dados foi apagado?</summary>

Não. `down` apaga containers e rede, mas mantém os volumes, onde estão os dados. Só `down -v` apaga os volumes.
</details>

<details><summary>3. Por que o <code>.env</code> não vai para o Git e o <code>.env.example</code> vai?</summary>

O `.env` tem as senhas reais. O `.env.example` mostra quais variáveis existem, com valores falsos, para quem clonar o projeto saber o que preencher.
</details>

<details><summary>4. Uma API rodando em outro container do mesmo Compose deve conectar em <code>localhost:5432</code> ou <code>postgres:5432</code>?</summary>

Em `postgres:5432`. Dentro de um container, `localhost` é ele mesmo. Na rede do Compose, cada serviço é encontrado pelo nome.
</details>

<details><summary>5. O container aparece como "Up", mas não como "healthy". A API já pode conectar?</summary>

Ainda não é garantido. "Up" só diz que o processo ligou. "healthy" diz que o teste de prontidão (`pg_isready`) passou.
</details>
