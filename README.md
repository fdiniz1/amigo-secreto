# Amigo Secreto

Aplicacao full stack para cadastro de participantes, execucao de sorteio de Amigo Secreto sem auto-sorteio, persistencia do historico e envio individual de e-mails.

O projeto usa:

- Frontend: React, TypeScript e Vite
- Backend: Node.js, Express, TypeScript, Prisma e PostgreSQL
- Banco: PostgreSQL
- E-mail: Resend API em producao e SMTP opcional em desenvolvimento

## Status do deploy

O projeto foi adaptado para deploy de custo zero ou quase zero com o menor retrabalho possivel:

- Frontend: Cloudflare Pages
- Backend/API: Render Free Web Service
- Banco: Neon Postgres Free
- E-mail: Resend Free via HTTP API

Essa combinacao preserva o backend Express atual, a modelagem Prisma/PostgreSQL, as rotas existentes e a regra de sorteio ja implementada.

## Por que nao migrar tudo para Cloudflare

Cloudflare Pages e uma boa escolha para o frontend estatico. Para o backend, porem, migrar para Cloudflare Workers exigiria trocar o runtime Node/Express, adaptar Prisma/PostgreSQL ou migrar para D1, e substituir o envio SMTP.

Para um teste tecnico que precisa ficar online rapido, manter Express no Render e usar Neon Postgres reduz risco e retrabalho. O unico ajuste relevante no e-mail e usar Resend por HTTP em producao, porque o Render Free bloqueia portas SMTP comuns.

## Funcionalidades

### Participantes

- Criar participante
- Listar participantes
- Buscar participante por ID
- Editar participante
- Excluir participante
- Limpar a lista atual de participantes
- Validacao basica de nome e e-mail
- E-mail unico

### Sorteio

- Exige no minimo 3 participantes
- Garante que ninguem tire a si mesmo
- Garante que todos tirem 1 pessoa
- Garante que todos sejam tirados 1 vez
- Salva historico completo do sorteio
- Envia e-mail individual para cada participante
- Se o envio de e-mail falhar, o sorteio continua salvo e a API retorna aviso

## Modelagem de dados

O backend preserva quatro models Prisma:

- `Participant`: lista atual da rodada
- `Draw`: sorteio executado
- `DrawParticipant`: snapshot dos participantes daquele sorteio
- `DrawResult`: pares gerados no sorteio

O fluxo do sorteio salva primeiro o historico (`Draw`, `DrawParticipant`, `DrawResult`) e so depois tenta enviar e-mails. Isso evita perder o resultado caso o provedor de e-mail falhe.

## Estrutura

```text
Amigo-Secreto/
  backend/
    prisma/
      schema.prisma
      migrations/
    src/
      app.ts
      server.ts
      routes.ts
      lib/
      middlewares/
      modules/
  frontend/
    src/
      components/
      services/
      App.tsx
      main.tsx
  render.yaml
```

## Rotas da API

- `GET /health`
- `GET /api/participants`
- `GET /api/participants/:id`
- `POST /api/participants`
- `PUT /api/participants/:id`
- `DELETE /api/participants/:id`
- `DELETE /api/participants`
- `POST /api/draw`

## Variaveis de ambiente

### Backend

Arquivo local: `backend/.env`

Use `backend/.env.example` como base.

```env
NODE_ENV=development
PORT=3333
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amigo_secreto?schema=public"

MAIL_PROVIDER=smtp
RESEND_API_KEY=
MAIL_FROM="Amigo Secreto <no-reply@seu-dominio.com>"
MAIL_REPLY_TO="Amigo Secreto <no-reply@seu-dominio.com>"

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Amigo Secreto <no-reply@amigosecreto.local>"
SMTP_REPLY_TO="Amigo Secreto <no-reply@amigosecreto.local>"
```

Para producao no Render, use:

```env
NODE_ENV=production
DATABASE_URL=<connection string do Neon com sslmode=require>
FRONTEND_URLS=https://<seu-projeto>.pages.dev
MAIL_PROVIDER=resend
RESEND_API_KEY=<sua chave da Resend>
MAIL_FROM="Amigo Secreto <no-reply@seu-dominio.com>"
MAIL_REPLY_TO="Amigo Secreto <seu-email@seu-dominio.com>"
```

Observacoes:

- `FRONTEND_URLS` aceita varias origens separadas por virgula.
- Em producao, prefira `MAIL_PROVIDER=resend`.
- Para Resend enviar para destinatarios reais, configure um dominio verificado no painel da Resend e use esse dominio em `MAIL_FROM`.
- SMTP continua disponivel para desenvolvimento local com Ethereal ou outro provedor SMTP.

### Frontend

Arquivo local: `frontend/.env`

Use `frontend/.env.example` como base.

```env
VITE_API_URL=http://localhost:3333/api
```

Em producao no Cloudflare Pages:

```env
VITE_API_URL=https://<sua-api>.onrender.com/api
```

## Rodando localmente

### 1. Banco local

Crie um banco PostgreSQL chamado `amigo_secreto` ou suba via Docker:

```bash
docker run --name amigo-secreto-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=amigo_secreto \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

A API fica em:

```text
http://localhost:3333
```

Health check:

```text
http://localhost:3333/health
```

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend fica em:

```text
http://localhost:5173
```

## Deploy em producao

### 1. Banco no Neon

1. Crie uma conta em `https://neon.com`.
2. Crie um projeto PostgreSQL.
3. Copie a connection string.
4. Use a URL com SSL, normalmente contendo `sslmode=require`.
5. Essa URL sera usada como `DATABASE_URL` no Render.

O schema e as migrations atuais sao mantidos. O deploy executa:

```bash
npm run db:migrate:deploy
```

### 2. Backend no Render

Opcao recomendada: usar o `render.yaml` deste repositorio.

1. Suba o projeto para o GitHub.
2. No Render, crie um novo Blueprint ou Web Service apontando para o repositorio.
3. Se usar Blueprint, o Render le o arquivo `render.yaml`.
4. Se configurar manualmente, use:

```text
Root Directory: backend
Build Command: npm ci --include=dev && npm run db:migrate:deploy && npm run build
Start Command: npm start
Health Check Path: /health
```

Variaveis obrigatorias no Render:

```env
NODE_ENV=production
DATABASE_URL=<connection string do Neon>
FRONTEND_URLS=https://<seu-projeto>.pages.dev
MAIL_PROVIDER=resend
RESEND_API_KEY=<sua chave da Resend>
MAIL_FROM="Amigo Secreto <no-reply@seu-dominio.com>"
MAIL_REPLY_TO="Amigo Secreto <seu-email@seu-dominio.com>"
```

Depois do deploy, a API ficara em uma URL parecida com:

```text
https://amigo-secreto-api.onrender.com
```

Teste:

```text
https://amigo-secreto-api.onrender.com/health
```

### 3. E-mail na Resend

1. Crie uma conta em `https://resend.com`.
2. Crie uma API key com permissao de envio.
3. Configure um dominio verificado para enviar e-mails reais.
4. Preencha `RESEND_API_KEY`, `MAIL_FROM` e `MAIL_REPLY_TO` no Render.

O backend envia um e-mail por participante usando a API HTTP da Resend. Se qualquer envio falhar, o sorteio ja tera sido salvo e a resposta de `POST /api/draw` trara `emailError`.

### 4. Frontend no Cloudflare Pages

1. Entre em `https://pages.cloudflare.com`.
2. Crie um projeto conectado ao GitHub.
3. Configure:

```text
Root Directory: frontend
Build Command: npm run build
Build Output Directory: dist
```

4. Em Environment Variables, adicione:

```env
VITE_API_URL=https://amigo-secreto-api.onrender.com/api
```

5. Faca o deploy.
6. Copie a URL final do Pages e atualize `FRONTEND_URLS` no Render com essa origem.
7. Faca redeploy do backend se o Render nao reiniciar automaticamente apos a mudanca de env.

## Scripts importantes

### Backend

```bash
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate
npm run db:migrate:deploy
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Arquivos alterados para deploy

- `backend/package.json`: scripts de build e migracao de producao
- `backend/src/app.ts`: CORS com multiplas origens por env
- `backend/src/lib/mail.ts`: Resend API em producao e SMTP como fallback
- `backend/.env.example`: variaveis de ambiente atualizadas
- `frontend/.env.example`: exemplo da URL da API
- `render.yaml`: configuracao opcional do backend no Render
- `README.md`: instrucoes de deploy e operacao

## Custos esperados

Para o escopo de teste tecnico, a expectativa e custo zero ou muito proximo de zero:

- Cloudflare Pages: hospedagem estatica com plano gratuito
- Render Free: API Node com limite mensal e cold start por inatividade
- Neon Free: Postgres gratuito com limites de uso e armazenamento
- Resend Free: envio gratuito dentro do limite mensal/diario

Antes de deixar o projeto publico por mais tempo, confira os limites atuais de cada servico.

## Observacoes de producao

- Render Free pode dormir depois de inatividade. A primeira requisicao apos esse periodo pode demorar.
- Nao use Render Postgres Free para este caso se precisar manter dados por mais de 30 dias; por isso a recomendacao e Neon.
- Nao salve `.env` no Git.
- Para e-mails reais, use dominio verificado na Resend.
- O endpoint `DELETE /api/participants` limpa apenas a rodada atual. O historico de sorteios permanece salvo.
