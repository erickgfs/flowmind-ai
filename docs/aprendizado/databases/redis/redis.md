# 🎓 Aula: Redis (do zero)
> **Categoria:** `databases` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 3 de 4 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/N7s1BQtcHYWDw9XYMqLAKG) · arquivo local [`redis.html`](./redis.html)

### 📚 Antes de começar (pré-requisitos)
- **Aula 1: [Docker](../../devops-infra/docker/docker.md)**, porque o Redis roda num container.
- **Aula 2: [PostgreSQL](../postgresql/postgresql.md)**, porque o Redis trabalha *junto* com ele.
- **Memória RAM vs. disco:** o computador tem dois lugares para guardar coisas.
  - A **RAM** (memória) é extremamente rápida, mas pequena, e **esquece tudo quando desliga**.
  - O **disco** (SSD/HD) é grande e permanente, mas bem mais lento.
  - Para ter ideia: se ler um dado da RAM levasse 1 segundo, ler do SSD levaria vários minutos. A diferença é de centenas a milhares de vezes.

### 🎯 O que é e qual problema resolve
**O problema.** Imagine o FlowMind com muitos usuários. Toda vez que alguém abre o quadro de tarefas, a API pergunta ao PostgreSQL "quais as tarefas do projeto 1?". Se 500 pessoas abrem o mesmo quadro no mesmo minuto, o banco faz o mesmo trabalho 500 vezes para dar a mesma resposta. Outras situações parecidas:
- guardar quem está logado (a **sessão**), consultado a cada clique;
- contar quantas vezes um usuário chamou a IA no último minuto, para impor um limite;
- deixar um trabalho demorado (resumir um documento com IA) numa **fila** para ser feito em segundo plano.

**A solução.** O **Redis** é um banco de dados que guarda tudo **na memória RAM**, no formato mais simples possível: **chave → valor**. Como fica na RAM, responde em microssegundos. Usamos o Redis como um **cache**: um lugar para deixar respostas prontas por um tempo, para não ter que calcular de novo.

**Analogia: a bancada e a despensa da cozinha.**
- A **despensa** é o PostgreSQL: cabe tudo, é organizada, é permanente. Mas ir até lá buscar cada ingrediente demora.
- A **bancada** é o Redis: pequena, mas tudo que está nela está à mão.
- Você deixa na bancada o que usa toda hora. Quando precisa de algo, olha primeiro na bancada; se não está, busca na despensa e deixa uma porção na bancada para a próxima vez.
- Na bancada as coisas têm **prazo de validade** (o **TTL**). Passou o prazo, você joga fora e, se precisar de novo, busca na despensa um ingrediente fresco.

*Onde a analogia falha:* nossa "bancada" tem um diário (o AOF, explicado abaixo), então não perde tudo quando o container reinicia. Mas mesmo assim o Redis **não é** o lugar oficial dos dados: a fonte da verdade continua sendo o PostgreSQL.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **RAM** | Memória rápida e temporária do computador. |
| **Chave (key)** | O "nome" pelo qual você guarda e acha um dado, como `tarefa:42`. |
| **Valor (value)** | O dado guardado naquela chave. |
| **Cache** | Cópia temporária de uma resposta, guardada num lugar rápido para reuso. |
| **Cache hit** | A resposta estava no cache: rápido. |
| **Cache miss** | Não estava: é preciso buscar na fonte (PostgreSQL). |
| **TTL** | "Time To Live": quantos segundos falta para a chave expirar e sumir sozinha. |
| **Invalidar cache** | Apagar uma chave do cache porque o dado original mudou. |
| **Sessão** | Registro de que um usuário está logado. |
| **Fila** | Lista de trabalhos esperando para serem processados em ordem. |
| **AOF** | "Append Only File": diário em disco com cada comando de escrita, usado para reconstruir os dados após reiniciar. |
| **RDB** | Outra forma de persistência: uma "foto" de toda a memória salva de tempos em tempos. |
| **redis-cli** | O cliente de terminal do Redis. |
| **Atômico** | Uma operação que acontece inteira, sem ninguém interromper no meio. |

### 🏗️ Como funciona no nosso projeto
- **Onde roda:** no container `flowmind-redis`, imagem `redis:7-alpine`, porta `6379`.
- **Protegido por senha:** a senha está em `REDIS_PASSWORD` no `.env`. Sem ela, nenhum comando funciona.
- **Persistência ligada:** rodamos com `--appendonly yes` (AOF). O diário fica no volume `redis_data`, então os dados sobrevivem a reinícios.
- **Usos planejados nas próximas fases:**

  | Uso | Exemplo no FlowMind |
  |---|---|
  | Cache | Lista de tarefas de um projeto, guardada por 60 segundos |
  | Sessões | Saber rapidamente se o token de login ainda vale |
  | Limite de uso | No máximo 20 chamadas à IA por minuto por usuário |
  | Filas | Gerar resumo de um documento com IA em segundo plano (BullMQ) |

### 🧠 Conceito Teórico / Por trás dos panos
**Cache-aside (o padrão que vamos usar).** A API sempre olha primeiro no Redis:
1. Pede `GET tarefas:projeto:1`.
2. Se existir (**hit**), responde na hora, sem tocar no PostgreSQL.
3. Se não existir (**miss**), busca no PostgreSQL, guarda a resposta no Redis com prazo (`SET ... EX 60`) e responde.
4. Quando alguém edita uma tarefa, a API apaga essa chave (**invalida**), para ninguém ver dado velho.

**Um comando por vez.** O Redis executa os comandos numa única fila, um de cada vez. Parece lento, mas como tudo está na RAM, cada comando leva microssegundos. A vantagem: operações como `INCR` (somar 1) são **atômicas**. Mil pessoas somando ao mesmo tempo nunca perdem uma contagem.

**Não é só texto.** Além de texto simples, o valor pode ter estrutura:

| Tipo | Parece com | Exemplo no FlowMind |
|---|---|---|
| String | uma variável | `cache:tarefa:42` → JSON da tarefa |
| Hash | um objeto com campos | `sessao:abc` → `{usuario_id: 7, expira: ...}` |
| List | uma fila | trabalhos de IA esperando processamento |
| Set | um conjunto sem repetição | ids de usuários online agora |
| Sorted Set | um ranking | tarefas ordenadas por prioridade |

**Persistência: AOF vs. RDB.** Por padrão, o que está na RAM se perde se o processo parar. O **AOF** grava cada comando de escrita num arquivo; ao reiniciar, o Redis "relê o diário" e reconstrói tudo. O **RDB** tira uma "foto" de tempos em tempos; é mais leve, mas perde o que mudou depois da última foto. Usamos AOF.

**Memória cheia.** A RAM acaba. Por isso todo dado de cache deve ter TTL. Em produção também se configura uma política (`maxmemory-policy`) para o Redis descartar as chaves menos usadas quando a memória enche.

### 🛠️ Comandos e Operação
Entrar no Redis (troque `SENHA` pelo valor de `REDIS_PASSWORD` no `.env`):
```bash
docker exec -it flowmind-redis redis-cli -a SENHA --no-auth-warning
#  redis-cli            o cliente do Redis
#  -a SENHA             autentica com a senha
#  --no-auth-warning    esconde o aviso "usar senha na linha de comando é inseguro"
```

Comandos essenciais (dentro do `redis-cli`):
```
PING                         → PONG (o servidor está vivo)
SET nome "FlowMind"          → guarda o valor na chave "nome"
GET nome                     → "FlowMind"
SET cache:x "abc" EX 60      → guarda por 60 segundos
TTL cache:x                  → quantos segundos faltam (-1 = sem prazo, -2 = não existe)
EXPIRE nome 30               → dá prazo de 30s a uma chave que já existe
EXISTS nome                  → 1 se existe, 0 se não
DEL nome                     → apaga a chave
INCR visitas                 → soma 1 (cria com 0 se não existir)
HSET tarefa:1 titulo "API" status "pendente"   → hash com campos
HGETALL tarefa:1             → todos os campos do hash
LPUSH fila:ia "doc-7"        → coloca um item no começo da lista
RPOP fila:ia                 → tira um item do fim da lista (ordem de chegada)
SCAN 0 MATCH cache:*         → procura chaves por padrão, sem travar o servidor
INFO server                  → versão e informações do servidor
```

### 🧪 Experimente você mesmo
1. **Entre no Redis.** Abra o `.env`, copie o valor de `REDIS_PASSWORD` e rode:
   ```bash
   docker exec -it flowmind-redis redis-cli -a SENHA --no-auth-warning
   PING
   ```
   Esperado: `PONG`.

2. **Guarde e leia um valor.**
   ```
   SET aula:saudacao "ola, redis"
   GET aula:saudacao
   ```
   Esperado: `OK` e depois `"ola, redis"`.

3. **Veja uma chave expirar sozinha.**
   ```
   SET aula:temporaria "some em 15s" EX 15
   TTL aula:temporaria
   ```
   Rode `TTL` algumas vezes: o número diminui. Depois de 15 segundos, `GET aula:temporaria` responde `(nil)` (não existe mais).

4. **Conte de forma atômica.**
   ```
   INCR aula:contador
   INCR aula:contador
   INCR aula:contador
   ```
   Esperado: `1`, `2`, `3`.

5. **Simule uma fila de trabalhos.**
   ```
   LPUSH aula:fila "resumir doc 1" "resumir doc 2"
   RPOP aula:fila
   ```
   Esperado: `"resumir doc 1"`. O primeiro a entrar é o primeiro a sair.

6. **Desfaça e saia.**
   ```
   DEL aula:saudacao aula:contador aula:fila
   exit
   ```

### ⚠️ Armadilhas Comuns
- **Usar o Redis como banco principal.** Ele é ótimo como apoio, mas a fonte da verdade são as tabelas do PostgreSQL. Se o cache sumir, o sistema deve continuar funcionando, só que mais devagar.
- **Cache sem TTL.** A memória enche aos poucos. Todo dado de cache leva `EX`.
- **Mostrar dado velho.** Editou a tarefa no PostgreSQL e esqueceu de apagar a chave no Redis: o usuário continua vendo a versão antiga até o TTL acabar.
- **`KEYS *` com muitos dados.** Lista todas as chaves de uma vez e trava o servidor enquanto isso. Use `SCAN`.
- **Redis sem senha e exposto na internet.** É um dos alvos mais atacados. Sempre `requirepass`, e nunca abra a porta 6379 para fora.
- **Chaves sem padrão de nome.** Use `objeto:id:detalhe`, como `cache:projeto:1:tarefas`. Fica fácil achar e apagar em grupo.
- **Esquecer a senha.** Sintoma: `(error) NOAUTH Authentication required.` Correção: entre com `-a SENHA` ou rode `AUTH SENHA` dentro do `redis-cli`.

### 🤔 Por que usamos / Quando usar
Use Redis quando a mesma informação é lida muitas vezes e pode ficar alguns segundos desatualizada (cache), quando precisa de contadores rápidos e seguros (limites de uso), ou para filas de trabalhos em segundo plano. No FlowMind, isso é importante porque chamadas a modelos de IA são lentas e caras: não queremos refazê-las sem necessidade nem travar a API esperando por elas.

Quando não usar: para dados que não podem se perder ou que têm relações entre si (usuários, projetos, tarefas). Esses ficam no PostgreSQL.

### ✅ Teste seu entendimento
<details><summary>1. Por que o Redis é tão mais rápido que o PostgreSQL para ler uma chave?</summary>

Porque guarda os dados na RAM e faz uma busca direta pela chave. O PostgreSQL trabalha com disco e com consultas mais complexas.
</details>

<details><summary>2. O que é um cache miss e o que a API faz quando acontece um?</summary>

É quando a chave não está no Redis. A API busca o dado no PostgreSQL, guarda uma cópia no Redis com TTL e responde.
</details>

<details><summary>3. Para que serve o TTL?</summary>

Para a chave sumir sozinha depois de um tempo. Isso evita encher a memória e limita por quanto tempo um dado desatualizado pode aparecer.
</details>

<details><summary>4. Se o container do Redis reiniciar, as chaves somem?</summary>

No FlowMind, não. O AOF está ligado e o arquivo fica no volume `redis_data`. Ao reiniciar, o Redis relê o diário e reconstrói as chaves (as que ainda não expiraram).
</details>
