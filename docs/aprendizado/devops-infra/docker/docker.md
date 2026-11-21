# 🎓 Aula: Docker (do zero)
> **Categoria:** `devops-infra` | **Registrado/Atualizado no Projeto:** `flowmind-ai` | **Nível:** iniciante · aula 1 de 4 da trilha
>
> 🖼️ **Aula visual:** [artefato online](https://claude.ai/artifact/5fqkigRyd9pL3ihV8d8Kvh) · arquivo local [`docker.html`](./docker.html)

### 📚 Antes de começar (pré-requisitos)
Nenhuma aula anterior. Só três ideias do dia a dia de um computador, que vamos usar o tempo todo:

- **Programa vs. processo:** o programa é o arquivo instalado (o `.exe`). O processo é esse programa *rodando*, ocupando memória. Abrir o Chrome duas vezes = 1 programa, 2 processos.
- **Terminal:** janela onde você digita comandos em texto em vez de clicar em botões. No VS Code: menu *Terminal → New Terminal* (ou ``Ctrl + ` ``).
- **Porta:** um número (de 0 a 65535) que diz *qual programa* dentro do computador deve receber uma conexão. Pense no computador como um prédio: o endereço `localhost` ("este computador aqui") leva até o prédio, e a porta é o número do apartamento. O PostgreSQL costuma morar no 5432 e o Redis no 6379.

### 🎯 O que é e qual problema resolve
**O problema.** Para o FlowMind funcionar, precisamos de dois programas de servidor: um banco de dados (PostgreSQL) e um cache (Redis). O jeito tradicional é instalar os dois direto no Windows. Funciona, mas:
- cada pessoa que for rodar o projeto precisa instalar as mesmas versões e configurar igual;
- um colega que já tem a versão 14 instalada para outro projeto vai ter conflito com a 16;
- desinstalar deixa sujeira (serviços, pastas, variáveis);
- resultado: o famoso "na minha máquina funciona".

**A solução.** O Docker roda cada programa dentro de uma **caixa isolada** chamada **container**. A caixa já vem com tudo que o programa precisa (o programa, as bibliotecas, as configurações padrão) e não mexe no resto do seu computador. Quer o PostgreSQL 16? Você pede a caixa pronta, ela liga em segundos, e quando não quiser mais, apaga a caixa e o Windows fica como antes.

**Analogia: a receita e o bolo.**
- A **imagem** é a *receita*: um pacote fechado que descreve exatamente o que deve existir. Ela não "roda", só fica guardada.
- O **container** é o *bolo* feito com a receita: é a coisa viva, rodando. Com uma receita você faz quantos bolos quiser, todos iguais.
- O **Docker Hub** é o *livro de receitas público* da internet: lá estão imagens oficiais prontas como `postgres`, `redis`, `node`.
- Jogar o bolo fora não apaga a receita: apagar um container não apaga a imagem.

*Onde a analogia falha:* um bolo não "roda". O container é um programa em execução, que pode ser parado e ligado de novo sem ser destruído.

### 🧩 Glossário
| Termo | Em uma frase |
|---|---|
| **Docker** | Ferramenta que cria e roda containers. |
| **Imagem** | Pacote somente-leitura com um programa e tudo de que ele precisa. A "receita". |
| **Container** | Uma imagem em execução: um processo isolado do resto do computador. O "bolo". |
| **Tag** | A versão da imagem, depois dos dois-pontos. Em `postgres:16-alpine`, a tag é `16-alpine`. |
| **Alpine** | Uma versão mínima do Linux, usada como base para deixar imagens pequenas. |
| **Docker Hub** | Site público com milhares de imagens prontas (hub.docker.com). |
| **Docker Engine (daemon)** | O "motor" que fica ligado em segundo plano e de fato cria e roda os containers. |
| **Docker CLI** | O comando `docker` que você digita. Ele só leva pedidos até o Engine. |
| **Docker Desktop** | O aplicativo para Windows/Mac que instala e liga o Engine. |
| **WSL2** | "Subsistema Windows para Linux": um Linux leve rodando dentro do Windows. |
| **Kernel** | O núcleo do sistema operacional, que controla memória, processos e hardware. |
| **Volume** | Uma pasta guardada pelo Docker *fora* do container, para os dados não sumirem. |
| **Mapeamento de porta** | Ligação entre uma porta do seu Windows e uma porta do container, como `5432:5432`. |

### 🏗️ Como funciona no nosso projeto
No FlowMind AI não instalamos PostgreSQL nem Redis no Windows. Os dois rodam como containers criados a partir das imagens oficiais `postgres:16-alpine` e `redis:7-alpine`. Quem descreve e liga esses containers é o arquivo `docker-compose.yml` (aula 4).

O caminho de um comando seu até um container:
1. Você digita `docker ps` no terminal do VS Code.
2. O **Docker CLI** envia o pedido ao **Docker Engine**.
3. No Windows, o Engine roda dentro de um **Linux leve (WSL2)**, porque containers são uma tecnologia do Linux. O Docker Desktop cuida disso para você.
4. O Engine responde com a lista de containers rodando.

Foi por isso que, na Fase 1, o primeiro erro foi `failed to connect to the docker API`: o Docker Desktop estava fechado, o motor estava desligado e o comando `docker` não tinha com quem conversar.

### 🧠 Conceito Teórico / Por trás dos panos
**Container não é máquina virtual.** Uma máquina virtual (VM) simula um computador inteiro e roda um sistema operacional completo dentro dele: gigabytes de disco e minutos para ligar. O container **não tem sistema operacional próprio**. Ele usa o kernel do Linux que já está rodando e só isola o processo. Por isso liga em segundos e ocupa megabytes.

O isolamento vem de dois recursos do kernel Linux:
- **Namespaces:** dão ao container a ilusão de estar sozinho. Ele vê só os próprios processos, a própria rede e os próprios arquivos.
- **cgroups:** limitam quanto de CPU e memória ele pode usar.

**Imagens são feitas de camadas.** A imagem `postgres:16-alpine` é uma pilha: Alpine Linux na base, PostgreSQL por cima, configuração no topo. Camadas iguais são reaproveitadas entre imagens, por isso a segunda imagem baseada em Alpine baixa mais rápido.

Quando um container liga, o Docker coloca uma camada fina *gravável* por cima da imagem. Tudo que o container escreve vai para essa camada, e ela **é apagada junto com o container**. É por isso que bancos de dados precisam de **volumes**: uma pasta fora do container que sobrevive a ele.

### 🛠️ Comandos e Operação
```bash
docker --version                 # confirma que o Docker está instalado
docker info                      # confirma que o Engine está LIGADO (deu erro? abra o Docker Desktop)

docker pull redis:7-alpine       # baixa a imagem (a receita) do Docker Hub
docker images                    # lista as imagens baixadas no seu PC

docker run -d --name meu-redis -p 6380:6379 redis:7-alpine
#  run            cria um container a partir da imagem e liga
#  -d             "detached": roda em segundo plano e devolve o terminal
#  --name         dá um nome ao container (senão o Docker inventa um)
#  -p 6380:6379   porta 6380 do Windows  →  porta 6379 de dentro do container

docker ps                        # containers rodando agora
docker ps -a                     # todos, inclusive os parados
docker logs meu-redis            # o que o programa escreveu na tela
docker exec -it meu-redis sh     # abre um terminal DENTRO do container (digite exit para sair)
docker stop meu-redis            # desliga (o container continua existindo)
docker start meu-redis           # liga de novo
docker rm meu-redis              # apaga o container (precisa estar parado)
docker rmi redis:7-alpine        # apaga a imagem (só se nenhum container usa ela)
```

### 🧪 Experimente você mesmo
Com o Docker Desktop aberto, no terminal do VS Code:

1. **Rode seu primeiro container.**
   ```bash
   docker run hello-world
   ```
   Esperado: uma mensagem começando com `Hello from Docker!`. O Docker não achou a imagem no PC, baixou do Docker Hub, criou um container, o programa imprimiu a mensagem e terminou.

2. **Veja que o container ainda existe, parado.**
   ```bash
   docker ps -a
   ```
   Procure a linha com a imagem `hello-world` e status `Exited (0)`. *Exited* = terminou; *(0)* = terminou sem erro.

3. **Veja os containers do FlowMind rodando.**
   ```bash
   docker ps
   ```
   Esperado: `flowmind-postgres` e `flowmind-redis` com status `Up ... (healthy)`.

4. **Entre num container e olhe em volta.**
   ```bash
   docker exec -it flowmind-redis sh
   cat /etc/os-release     # mostra "Alpine Linux": o container acha que é um Linux sozinho
   ps                      # só aparecem os processos do próprio container
   exit                    # volta para o seu terminal
   ```

5. **Desfaça o teste.**
   ```bash
   docker rm $(docker ps -aq --filter ancestor=hello-world)   # apaga os containers do hello-world
   docker rmi hello-world                                     # apaga a imagem
   ```

### ⚠️ Armadilhas Comuns
- **Docker Desktop fechado.** Sintoma: `failed to connect to the docker API` ou `error during connect`. Correção: abra o Docker Desktop e espere aparecer "Engine running".
- **Achar que `docker stop` apaga.** Não apaga: o container fica parado e aparece em `docker ps -a`. Quem apaga é `docker rm`.
- **Guardar dados importantes num container sem volume.** Ao apagar o container, os dados vão junto.
- **Usar a tag `latest`** (ou nenhuma tag, que dá no mesmo). Hoje ela aponta para uma versão, amanhã para outra. Sempre fixe a versão: `postgres:16-alpine`.
- **Porta já ocupada.** Sintoma: `port is already allocated`. Outro programa já usa aquela porta do Windows. Correção: troque o número da esquerda, como `-p 5433:5432`.
- **Confundir as duas portas de `-p 6380:6379`.** A da esquerda é a do seu Windows; a da direita é a de dentro do container.

### 🤔 Por que usamos / Quando usar
Use Docker quando o projeto precisa de programas de servidor (banco, cache, fila) e você quer que qualquer pessoa rode o projeto com as mesmas versões, sem instalar nada além do Docker. Para um portfólio, isso significa que quem avaliar o FlowMind consegue rodá-lo em minutos.

Quando não vale a pena: um script pequeno sem dependências externas, ou um programa simples que só roda no seu PC. Aí o Docker só adiciona uma camada a mais.

### ✅ Teste seu entendimento
<details><summary>1. Qual a diferença entre imagem e container?</summary>

A imagem é o pacote parado e somente-leitura (a receita). O container é a imagem em execução (o bolo). De uma imagem saem quantos containers você quiser.
</details>

<details><summary>2. Você rodou <code>docker rm flowmind-postgres</code>. A imagem <code>postgres:16-alpine</code> sumiu?</summary>

Não. Só o container foi apagado. A imagem continua em `docker images`, e um novo container pode ser criado a partir dela.
</details>

<details><summary>3. Por que o Docker no Windows precisa do WSL2?</summary>

Containers usam recursos do kernel do Linux (namespaces e cgroups). O WSL2 fornece um Linux leve dentro do Windows para o Docker Engine rodar.
</details>

<details><summary>4. Em <code>-p 5433:5432</code>, em qual porta você conecta a partir do Windows?</summary>

Na 5433. A da esquerda é a do seu computador; a 5432 é a porta interna do container.
</details>
