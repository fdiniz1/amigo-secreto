# Amigo Secreto

Aplicacao full stack para cadastro de participantes, execucao de sorteio de Amigo Secreto sem auto-sorteio, persistencia do historico e envio individual de e-mails.

O projeto usa:

- Frontend: React, TypeScript e Vite
- Backend: Node.js, Express, TypeScript, Prisma e PostgreSQL
- Banco: PostgreSQL
- E-mail: Resend API em producao e SMTP/Nodemailer como fallback local

## Status do deploy

O projeto esta preparado para deploy de custo zero ou quase zero:

- Frontend: Cloudflare Pages
- Backend/API: Render Free Web Service
- Banco: Neon Postgres Free
- E-mail: Resend Free via HTTP API

Essa combinacao preserva o backend Express atual, a modelagem Prisma/PostgreSQL, as rotas existentes e a regra de sorteio ja implementada.

## Funcionamento do sorteio em producao

O endpoint `POST /api/draw` nao espera o envio dos e-mails terminar.

Fluxo atual:

1. busca participantes atuais em `Participant`
2. valida minimo de 3 participantes
3. gera pares validos sem auto-sorteio
4. salva `Draw`, `DrawParticipant` e `DrawResult`
5. retorna os pares sorteados para a interface
6. dispara o envio dos e-mails em background
7. retorna sucesso imediatamente

Resposta esperada:

```json
{
  "message": "Sorteio realizado com sucesso.",
  "emailError": null,
  "draw": {
    "id": 1,
    "createdAt": "2026-06-24T19:31:15.174Z",
    "totalParticipants": 3
  },
  "pairs": [
    {
      "giverName": "Joao",
      "giverEmail": "joao@email.com",
      "receiverName": "Maria",
      "receiverEmail": "maria@email.com"
    }
  ]
}
```

Se o envio de e-mail falhar depois da resposta, o sorteio continua salvo e a falha fica apenas no log do backend.
Enquanto o dominio do provedor de e-mail nao estiver verificado, a tela de sucesso mostra esses pares diretamente na interface.

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
- Mostra os pares sorteados na tela de sucesso
- Envia e-mails individuais em background apos salvar o sorteio
- Falhas de e-mail nao revertem o sorteio

## Modelagem de dados

O backend preserva quatro models Prisma:

- `Participant`: lista atual da rodada
- `Draw`: sorteio executado
- `DrawParticipant`: snapshot dos participantes daquele sorteio
- `DrawResult`: pares gerados no sorteio

O historico e salvo antes do envio de e-mail. Assim, mesmo que o provedor de e-mail falhe, os dados do sorteio permanecem consistentes.

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

Regras de e-mail:

- Se `RESEND_API_KEY` estiver preenchida, o backend usa Resend.
- Se `RESEND_API_KEY` estiver vazia, o backend usa SMTP/Nodemailer.
- `MAIL_FROM` e usado como remetente da Resend.
- `SMTP_FROM` tambem e aceito como fallback para o remetente da Resend.
- Em desenvolvimento local, Ethereal funciona pelo fallback SMTP.

Para producao no Render, use:

```env
NODE_ENV=production
DATABASE_URL=<connection string do Neon com sslmode=require>
FRONTEND_URLS=https://<seu-projeto>.pages.dev
RESEND_API_KEY=<sua chave da Resend>
MAIL_FROM="Amigo Secreto <no-reply@seu-dominio.com>"
MAIL_REPLY_TO="Amigo Secreto <seu-email@seu-dominio.com>"
```

Observacoes:

- `FRONTEND_URLS` aceita varias origens separadas por virgula.
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

Quando `RESEND_API_KEY` existe, o backend envia os e-mails pela API HTTP da Resend. O envio acontece em background depois que o sorteio ja foi salvo.

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

## Arquivos relevantes para deploy

- `backend/src/lib/mail.ts`: Resend quando `RESEND_API_KEY` existe, SMTP quando nao existe
- `backend/src/modules/draw/draw.service.ts`: salva o sorteio, retorna os pares e dispara e-mails em background
- `frontend/src/services/draw.ts`: tipo do retorno do sorteio, incluindo `pairs`
- `frontend/src/components/DrawSuccessCard.tsx`: tela de sucesso com detalhes da rodada e pares sorteados
- `backend/.env.example`: variaveis de ambiente de banco, CORS e e-mail
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
