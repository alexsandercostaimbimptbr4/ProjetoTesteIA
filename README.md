# Painel CRM

Projeto de aprendizado e portfólio: cadastro, login e logout com e-mail e
senha, e um dashboard de CRM protegido. O dashboard é uma casca com dados de
demonstração; os módulos reais (contatos, funil de vendas, tarefas, relatórios)
ainda não existem.

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

## Como a proteção funciona

- `proxy.ts` roda a cada requisição, renova a sessão e redireciona: deslogado
  em `/` ou em qualquer endereço sob `/dashboard` vai para o login; logado em
  `/`, `/login` ou `/cadastro` vai para o dashboard.
- O layout do dashboard e a função que entrega os dados conferem a sessão de
  novo no servidor.
- A sessão fica em cookies HTTP-only, e o Supabase só é chamado pelo servidor.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `app/(auth)/` | telas de login e cadastro, e as actions de entrar, cadastrar e sair |
| `app/dashboard/` | casca do dashboard |
| `components/auth/`, `components/dashboard/` | formulários e peças do dashboard |
| `components/ui/` | componentes gerados pelo shadcn/ui |
| `lib/auth/` | validação, tradução de erros, regras de rota, usuário atual |
| `lib/supabase/` | cliente Supabase do servidor e renovação da sessão |
| `lib/dashboard/` | dados de demonstração |
| `e2e/` | testes de ponta a ponta |
| `docs/superpowers/` | spec e plano de implementação |

O desenho completo está em
[`docs/superpowers/specs/2026-10-07-login-dashboard-crm-design.md`](docs/superpowers/specs/2026-10-07-login-dashboard-crm-design.md).
