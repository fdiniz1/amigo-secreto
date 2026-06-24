# Amigo Secreto

Aplicação full stack para gerenciamento de participantes de um Amigo Secreto, realização de sorteio sem auto-sorteio e envio automático de e-mails individuais informando quem cada pessoa deve presentear.

O projeto foi desenvolvido com **Node.js + Express + Prisma + PostgreSQL** no backend e **React + TypeScript + Vite** no frontend.

---

# Visão geral

A aplicação permite:

* cadastrar participantes com **nome** e **e-mail**
* editar participantes
* excluir participantes
* listar participantes cadastrados
* realizar o sorteio do Amigo Secreto
* enviar um **e-mail individual** para cada participante informando quem ele tirou
* reiniciar a rodada para montar um novo Amigo Secreto

Além disso, o projeto foi estruturado para preservar o histórico de sorteios já realizados.

---

# Stack utilizada

## Backend

* Node.js
* TypeScript
* Express
* Prisma ORM
* PostgreSQL
* Nodemailer

## Frontend

* React
* TypeScript
* Vite

## Banco de dados

* PostgreSQL

## E-mail

* SMTP configurável
* suporte a **Ethereal** para ambiente de desenvolvimento/testes

---

# Funcionalidades implementadas

## Participantes

* Criar participante
* Listar participantes
* Editar participante
* Excluir participante
* Limpar a lista atual de participantes para iniciar uma nova rodada

## Sorteio

* Realizar sorteio do Amigo Secreto
* Garantir que **ninguém tire a si mesmo**
* Persistir o sorteio no banco
* Tirar um “snapshot” dos participantes da rodada para manter o histórico íntegro
* Enviar e-mails individuais após o sorteio

## Frontend

* Tela de cadastro
* Lista de participantes
* Modal de edição
* Modal de confirmação de exclusão
* Modal de confirmação de reinício da rodada
* Tela final de sucesso após sorteio
* Loading visual durante o sorteio

---

# Arquitetura da solução

O projeto foi dividido em duas partes:

```text
amigo-secreto/
├─ backend/
└─ frontend/
```

---

# Estrutura do projeto

## Backend

```text
backend/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ routes.ts
│  ├─ lib/
│  │  ├─ prisma.ts
│  │  ├─ mail.ts
│  │  └─ async-handler.ts
│  ├─ middlewares/
│  │  └─ error-handler.ts
│  └─ modules/
│     ├─ participants/
│     │  ├─ participants.routes.ts
│     │  ├─ participants.controller.ts
│     │  └─ participants.service.ts
│     └─ draw/
│        ├─ draw.routes.ts
│        ├─ draw.controller.ts
│        └─ draw.service.ts
```

## Frontend

```text
frontend/
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ vite-env.d.ts
│  ├─ components/
│  │  ├─ ConfirmModal.tsx
│  │  ├─ DrawLoadingModal.tsx
│  │  ├─ DrawSuccessCard.tsx
│  │  ├─ EditParticipantModal.tsx
│  │  ├─ ParticipantForm.tsx
│  │  └─ ParticipantsList.tsx
│  └─ services/
│     ├─ participants.ts
│     └─ draw.ts
```

---

# Modelagem de dados

A aplicação utiliza **quatro entidades principais**.

## 1. Participant

Representa a lista atual de participantes cadastrados para a rodada atual.

Campos:

* `id`
* `name`
* `email`
* `createdAt`
* `updatedAt`

## 2. Draw

Representa uma execução de sorteio.

Campos:

* `id`
* `name` (opcional)
* `createdAt`
* `updatedAt`

## 3. DrawParticipant

Representa o **snapshot dos participantes dentro de um sorteio**.

Esse model foi criado para preservar o histórico corretamente.
Mesmo que a lista atual de participantes seja apagada ou alterada depois, o sorteio passado continua íntegro.

Campos:

* `id`
* `drawId`
* `name`
* `email`
* `createdAt`
* `updatedAt`

## 4. DrawResult

Representa os pares do sorteio.

Campos:

* `id`
* `drawId`
* `giverParticipantId`
* `receiverParticipantId`

Nesse caso, `giverParticipantId` e `receiverParticipantId` apontam para **DrawParticipant**, e não para `Participant`.

---

# Decisões técnicas importantes

## 1. Separação entre Participant e DrawParticipant

No começo, o sorteio apontava diretamente para `Participant`.
Esse desenho gerava um problema: ao apagar ou editar participantes depois do sorteio, o histórico poderia ficar inconsistente.

Por isso, a solução foi separar:

* **Participant** → estado atual da rodada
* **DrawParticipant** → cópia/snapshot do participante dentro de cada sorteio realizado

Isso garante histórico consistente mesmo após reset da rodada.

---

## 2. Garantia de que ninguém tira a si mesmo

Um dos principais pontos de atenção foi garantir que o sorteio nunca gerasse um participante tirando a si próprio.

A solução implementada foi:

1. buscar todos os participantes
2. embaralhar a lista
3. montar os pares por rotação circular:

   * cada participante entrega para o próximo da lista embaralhada
   * o último entrega para o primeiro

Com isso:

* todos tiram alguém
* todos são tirados por alguém
* ninguém tira a si mesmo

Além da validação em memória, também existe uma validação no banco para evitar pares inválidos no resultado do sorteio.

---

## 3. Preservação do histórico do sorteio

Ao realizar o sorteio, o sistema:

1. cria um registro em `Draw`
2. copia os participantes atuais para `DrawParticipant`
3. cria os pares em `DrawResult` usando os IDs de `DrawParticipant`
4. só depois envia os e-mails

Isso garante que:

* o sorteio fica salvo mesmo se os e-mails falharem
* o histórico não depende do estado atual da lista de participantes

---

## 4. Tratamento de nomes repetidos no e-mail

Outro ponto tratado foi a exibição de nomes no e-mail.

Exemplo:

* `Maria Silva`
* `Maria Souza`

Se duas pessoas têm o mesmo primeiro nome, o e-mail passa a usar o nome suficiente para diferenciar:

* `Maria Silva`
* `Maria Souza`

Se o primeiro nome for único, o e-mail usa apenas o primeiro nome:

* `João`

Essa regra foi aplicada tanto para:

* quem está recebendo o e-mail
* quanto para o nome da pessoa sorteada

---

## 5. CORS configurado no backend

Como o frontend roda em uma porta diferente do backend durante o desenvolvimento, foi necessário configurar CORS no Express.

A API foi preparada para aceitar requisições do frontend por meio da variável de ambiente `FRONTEND_URL`.

Exemplo:

* frontend: `http://localhost:5173`
* backend: `http://localhost:3333`

---

## 6. Prisma Client em singleton

Foi adotado um singleton para o Prisma Client no backend para evitar múltiplas conexões em ambiente de desenvolvimento com hot reload.

---

## 7. Envio de e-mail desacoplado da persistência

O sistema primeiro salva o sorteio e só depois tenta enviar os e-mails.

Se o SMTP falhar:

* o sorteio continua salvo no banco
* a API retorna uma mensagem de aviso
* a interface informa que o sorteio foi salvo, mas houve falha no envio dos e-mails

Isso evita perda de sorteio por indisponibilidade momentânea do servidor SMTP.

---

# Requisitos

## Necessários

* Node.js 18+
* npm
* PostgreSQL

## Opcional

* Docker, para subir o PostgreSQL rapidamente

---

# Como rodar o projeto

## 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd amigo-secreto
```

---

# Banco de dados

## Opção 1: PostgreSQL local

Crie um banco chamado:

```sql
CREATE DATABASE amigo_secreto;
```

## Opção 2: PostgreSQL via Docker

```bash
docker run --name amigo-secreto-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=amigo_secreto \
  -p 5432:5432 \
  -d postgres:16
```

---

# Configuração do backend

Entre na pasta do backend:

```bash
cd backend
npm install
```

Crie o arquivo `.env` com base no exemplo abaixo.

## backend/.env

```env
PORT=3333
FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amigo_secreto?schema=public"

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=SEU_USUARIO
SMTP_PASS=SUA_SENHA
SMTP_FROM="Amigo Secreto <no-reply@amigosecreto.local>"
SMTP_REPLY_TO="Amigo Secreto <no-reply@amigosecreto.local>"
```

---

# Prisma / banco de dados

Ainda dentro da pasta `backend`, execute:

```bash
npx prisma generate
npx prisma migrate dev
```

Se quiser inspecionar os dados no navegador:

```bash
npx prisma studio
```

---

# Rodando o backend

Na pasta `backend`:

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3333
```

---

# Configuração do frontend

Abra outro terminal e vá para o frontend:

```bash
cd frontend
npm install
```

Crie o arquivo `.env`:

## frontend/.env

```env
VITE_API_URL=http://localhost:3333/api
```

Se estiver usando TypeScript com Vite, também é necessário ter o arquivo:

## frontend/src/vite-env.d.ts

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

# Rodando o frontend

Na pasta `frontend`:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

---

# Rotas da API

## Health check

### `GET /health`

Verifica se a API está online.

---

## Participantes

### `GET /api/participants`

Lista todos os participantes.

### `GET /api/participants/:id`

Busca um participante por ID.

### `POST /api/participants`

Cria um participante.

Exemplo de body:

```json
{
  "name": "João Silva",
  "email": "joao@email.com"
}
```

### `PUT /api/participants/:id`

Atualiza um participante.

Exemplo de body:

```json
{
  "name": "João Silva",
  "email": "joao@email.com"
}
```

### `DELETE /api/participants/:id`

Remove um participante.

### `DELETE /api/participants`

Limpa a lista atual de participantes.

> Observação: esse endpoint limpa apenas a lista atual da rodada.
> O histórico de sorteios (`Draw`, `DrawParticipant`, `DrawResult`) é preservado.

---

## Sorteio

### `POST /api/draw`

Executa o sorteio, persiste o resultado e envia os e-mails.

Exemplo de resposta:

```json
{
  "message": "Sorteio realizado com sucesso.",
  "emailError": null,
  "draw": {
    "id": 1,
    "createdAt": "2026-06-24T19:31:15.174Z",
    "totalParticipants": 3
  }
}
```

---

# Fluxo do sorteio

Ao chamar `POST /api/draw`, o backend executa o seguinte fluxo:

1. busca os participantes atuais
2. valida se existem pelo menos 3 participantes
3. embaralha os participantes
4. monta os pares do sorteio sem auto-sorteio
5. cria o registro de `Draw`
6. cria o snapshot dos participantes em `DrawParticipant`
7. salva os pares em `DrawResult`
8. tenta enviar os e-mails
9. retorna o resultado para o frontend

---

# Como testar o envio de e-mail com Ethereal

Para desenvolvimento, o mais simples é usar **Ethereal**.

## Passo 1

Acesse:

```text
https://ethereal.email/
```

Crie uma conta de teste e copie as credenciais SMTP.

## Passo 2

Preencha essas credenciais no `backend/.env`.

## Passo 3

Execute um sorteio.

## Passo 4

O backend exibirá no console uma URL de preview de cada e-mail enviado.

Exemplo:

```text
[email] Preview para joao@email.com: https://ethereal.email/message/...
```

Essa URL permite visualizar o e-mail no navegador sem precisar enviar um e-mail real.

---

# Como usar a aplicação

## 1. Cadastrar participantes

* abra o frontend
* preencha nome e e-mail
* clique em **Adicionar**

## 2. Editar participante

* na lista, clique em **Editar**
* um modal será aberto
* altere nome e/ou e-mail
* clique em **Atualizar**

## 3. Excluir participante

* clique em **Excluir**
* confirme a exclusão no modal

## 4. Realizar sorteio

* com pelo menos 3 participantes, clique em **Realizar sorteio**
* o sistema salva o sorteio e envia os e-mails

## 5. Iniciar nova rodada

* após o sorteio, clique em **iniciar novo amigo secreto**
* a lista atual de participantes será limpa
* o histórico dos sorteios anteriores será mantido no banco

---

# Regras de negócio implementadas

## Participantes

* nome obrigatório
* e-mail obrigatório
* e-mail único
* nome tratado com trim e normalização de espaços

## Sorteio

* mínimo de 3 participantes
* ninguém pode tirar a si mesmo
* todos devem tirar exatamente uma pessoa
* todos devem ser tirados exatamente uma vez
* o sorteio é salvo antes do envio de e-mail

## E-mail

* um e-mail por participante
* tratamento de nomes repetidos no primeiro nome
* template em texto e HTML

---

# Possíveis melhorias futuras

* tela de histórico de sorteios
* reenvio manual de e-mails de uma rodada específica
* nome da rodada / evento de amigo secreto
* data limite / valor do presente
* tela administrativa para visualizar os pares do sorteio
* autenticação
* deploy em nuvem
* testes automatizados

---

# Checklist de entrega

* [x] CRUD completo de participantes
* [x] Sorteio de Amigo Secreto
* [x] Garantia de que ninguém tira a si mesmo
* [x] Envio de e-mail individual
* [x] Backend em Node.js
* [x] Frontend em React
* [x] Persistência em PostgreSQL
* [x] README com instruções de execução
* [x] Tratamento de CORS
* [x] Snapshot do sorteio para preservar histórico
* [x] Tratamento de nomes duplicados no e-mail

---

# Observação final

O projeto foi pensado para ser simples, mas com uma estrutura sólida o suficiente para suportar evolução.
Mesmo sendo um sistema pequeno, foram tratados pontos importantes de robustez, como:

* consistência do histórico de sorteios
* separação entre estado atual e snapshot da rodada
* prevenção de auto-sorteio
* tratamento de falha de e-mail sem perda do sorteio
* organização de frontend e backend em camadas
* configuração por variáveis de ambiente
