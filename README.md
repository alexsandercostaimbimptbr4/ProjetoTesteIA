# Painel CRM

Projeto de aprendizado e portfólio: cadastro, login, logout e recuperação de
senha com e-mail e senha, e um dashboard de CRM protegido. O dashboard é uma
casca com dados de demonstração; os módulos reais (contatos, funil de vendas,
tarefas, relatórios) ainda não existem.

## Stack

- Next.js 16.4 (App Router, Cache Components) com TypeScript
- Supabase Auth via `@supabase/ssr`
- Tailwind CSS 4 e shadcn/ui
- Zod para validação
- Vitest e Playwright para testes

## Como rodar

Você precisa de Node.js (testado com a versão 24) e de um projeto Supabase (o
plano gratuito basta).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com a URL e a chave
   publicável do seu projeto Supabase (Project Settings → API Keys):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Use só a chave publicável. A chave secreta não é usada neste projeto.

3. No painel do Supabase, desligue a confirmação de e-mail: Authentication →
   Sign In / Providers → Email → **Confirm email** desligado → Save. Sem isso,
   o cadastro cria a conta mas não entra no dashboard.

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Abra http://localhost:3000 e crie uma conta em "Cadastre-se".

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento na porta 3000 |
| `npm run build` | build de produção |
| `npm run start` | serve o build de produção |
| `npm run lint` | ESLint |
| `npm test` | testes unitários (Vitest) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright) |

## Testes de ponta a ponta

`npm run test:e2e` gera um build de produção, serve na porta 3100 e roda os
testes no Chromium. Não interfere no `npm run dev`. Na primeira vez, instale o
navegador com `npx playwright install chromium`.

Atenção: os testes rodam contra o seu projeto Supabase real e **criam dez
contas por execução**, com e-mails `e2e-…@example.com`. Apague-as de
tempos em tempos em Authentication → Users. Se o Supabase recusar o domínio
`example.com`, defina `E2E_EMAIL_DOMAIN` em `.env.local` com um domínio real.

## Publicar no Easypanel

O `Dockerfile` na raiz gera a imagem de produção: instala as dependências,
faz o build no modo standalone e roda `node server.js` na porta 3000. O
build baixa as fontes do Google Fonts, então o servidor precisa de acesso à
internet nessa etapa.

Atenção: com a confirmação de e-mail desligada (passo 3 de "Como rodar"),
qualquer pessoa que tenha o endereço do site consegue criar uma conta.

Os nomes das telas abaixo podem variar conforme a versão do Easypanel.

1. Envie o repositório para o GitHub.
2. No Easypanel, crie um serviço do tipo **App** e, em **Source**, aponte para
   o repositório e a branch. Em **Build**, escolha **Dockerfile** (arquivo
   `Dockerfile`).
3. Em **Environment**, defina as duas variáveis antes do primeiro deploy:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   O Next.js grava essas variáveis no build, não na inicialização. Por isso o
   build falha com uma mensagem clara se elas faltarem, e é preciso fazer um
   novo deploy (não só reiniciar) sempre que mudarem.
4. Em **Domains**, adicione o domínio com HTTPS e a porta do contêiner
   **3000**. O HTTPS é obrigatório: por HTTP fora de `localhost` o navegador
   descarta os cookies de sessão, e o login volta para a tela de entrada sem
   mensagem de erro.
5. Clique em **Deploy**.

Para testar a imagem na sua máquina, com Docker instalado:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  -t painel-crm .
docker run --rm -p 3000:3000 painel-crm
```

Depois abra http://localhost:3000. Use exatamente `localhost`, no Chrome ou
no Firefox: os cookies de sessão são `Secure`, e por HTTP o navegador só os
aceita nesse endereço. Se depois o `npm run dev` não mantiver o login ou o
logout, apague os cookies de `localhost`.

## Recuperação de senha

Em "Esqueci minha senha", na tela de login, a pessoa informa o e-mail e
recebe um link para `/redefinir-senha`, onde cria a nova senha e já entra no
dashboard. O link vale uma vez só e é conferido apenas quando o formulário é
enviado: abrir o link não loga ninguém.

Para os e-mails saírem, configure três coisas no painel do Supabase (os nomes
dos menus podem variar):

1. **Endereço do site.** Authentication → URL Configuration → **Site URL**:
   o endereço público do app, sem barra no fim. O link do e-mail é montado
   com ele.
2. **Modelo do e-mail.** Authentication → Emails → Templates → **Reset
   Password**. Troque o assunto por `Criar uma nova senha` e o corpo por:

   ```html
   <h2>Criar uma nova senha</h2>
   <p>Recebemos um pedido para trocar a senha da sua conta no Painel CRM.</p>
   <p>
     <a href="{{ .SiteURL }}/redefinir-senha?token_hash={{ .TokenHash }}"
       >Criar nova senha</a
     >
   </p>
   <p>Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>
   ```

3. **Servidor de e-mail próprio.** Authentication → Emails → **SMTP
   Settings**. Sem ele, o Supabase só entrega mensagens aos membros da
   organização dona do projeto, e poucas por hora: serve para testar com o
   seu próprio e-mail, não para usuários reais.

Se o projeto Supabase exigir senhas mais fortes que as do app (8 a 72
caracteres), deixe as duas regras iguais: uma senha recusada só pelo Supabase
gasta o link, e a pessoa precisa pedir outro.

A tela responde sempre "Se existir uma conta com este e-mail, enviamos um
link…", exista a conta ou não. Quando o Supabase recusa o envio (endereço não
autorizado, limite de envios), o motivo aparece só no log do servidor, como
`Falha ao pedir o e-mail de recuperação`, com o código do erro.

Com o **Site URL** apontando para o site publicado, o link do e-mail abre o
site publicado. Para testar no `npm run dev`, copie o link e troque o
endereço por `http://localhost:3000`.

## Como a proteção funciona

- `proxy.ts` roda a cada requisição de página (não para arquivos estáticos
  nem imagens), renova a sessão e redireciona: deslogado
  em `/` ou em qualquer endereço sob `/dashboard` vai para o login; logado em
  `/`, `/login` ou `/cadastro` vai para o dashboard.
- O layout do dashboard e a função que entrega os dados conferem a sessão de
  novo no servidor.
- A sessão fica em cookies HTTP-only (e `Secure` no build de produção), e o
  Supabase só é chamado pelo servidor.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `app/(auth)/` | telas de login, cadastro e recuperação de senha, e as actions de entrar, cadastrar, recuperar a senha e sair |
| `app/dashboard/` | casca do dashboard |
| `components/auth/`, `components/dashboard/` | formulários e peças do dashboard |
| `components/ui/` | componentes gerados pelo shadcn/ui |
| `lib/auth/` | validação, tradução de erros, regras de rota, usuário atual, troca de senha pelo link |
| `lib/supabase/` | cliente Supabase do servidor e renovação da sessão |
| `lib/dashboard/` | dados de demonstração |
| `e2e/` | testes de ponta a ponta |
| `Dockerfile`, `.dockerignore` | imagem de produção para o Easypanel |
| `docs/superpowers/` | spec e plano de implementação |

O desenho completo está em
[`docs/superpowers/specs/2026-10-07-login-dashboard-crm-design.md`](docs/superpowers/specs/2026-10-07-login-dashboard-crm-design.md).
