# Login e casca do dashboard de CRM — Design

Data: 2026-10-07
Status: implementado. Este documento foi atualizado depois da implementação
para descrever o que existe no código.

## Objetivo

Projeto de aprendizado e portfólio. Entregar uma aplicação web em que a pessoa
cria uma conta com e-mail e senha, entra, vê um dashboard de CRM protegido e
sai. O dashboard nesta versão é uma casca com dados de exemplo; os módulos reais
do CRM terão specs próprias.

Sucesso significa:

- Quem não está logado não consegue ver o dashboard.
- Cadastro, login e logout funcionam de ponta a ponta contra o Supabase.
- O dashboard mostra o nome e o e-mail de quem está logado.
- A interface e as mensagens de erro estão em português.
- Os testes unitários e de ponta a ponta passam.

## Escopo

Dentro:

- Cadastro com nome, e-mail e senha.
- Login com e-mail e senha.
- Logout.
- Proteção de rotas no servidor.
- Casca do dashboard: menu lateral, cabeçalho com usuário, cartões de
  indicadores e lista de atividades, tudo com dados de exemplo.
- Tema claro e escuro seguindo a preferência do sistema.
- Páginas de "não encontrada" e de erro em português.
- Execução local.

Fora:

- Recuperação de senha e confirmação de e-mail.
- Login social.
- Perfis de acesso (admin, usuário comum).
- Módulos reais do CRM (contatos, funil, tarefas, relatórios).
- Publicação na internet.

## Stack

- Next.js 16.4 (App Router) com TypeScript, com Cache Components ligado
  (`cacheComponents` e `partialPrefetching` em `next.config.ts`, padrão do
  gerador de projetos).
- Supabase Auth para usuários e sessão, via `@supabase/ssr`.
- Tailwind CSS 4 e shadcn/ui para a interface.
- Zod para validação.
- Vitest para testes unitários e Playwright para testes de ponta a ponta.

Nenhuma tabela própria é criada nesta versão. Os usuários ficam na tabela
interna do Supabase Auth, e o nome vai nos metadados do usuário.

## Arquitetura

### Rotas

| Rota | Acesso | Comportamento |
|---|---|---|
| `/` | qualquer um | redireciona para `/dashboard` se logado, senão para `/login` |
| `/login` | só deslogado | formulário de e-mail e senha |
| `/cadastro` | só deslogado | formulário de criação de conta |
| `/dashboard` | só logado | casca do CRM |

### Fluxo da sessão

1. O formulário envia os dados para uma Server Action.
2. A action valida com Zod e chama o Supabase.
3. O Supabase devolve a sessão, gravada em cookies HTTP-only. A biblioteca
   não liga essa opção por padrão; ela é definida em
   `lib/supabase/cookie-options.ts`.
4. A cada requisição, o interceptador `proxy.ts` (o antigo `middleware.ts`,
   renomeado no Next.js 16) renova a sessão e aplica os redirecionamentos:
   deslogado em `/dashboard` vai para `/login`; logado em `/login` ou
   `/cadastro` vai para `/dashboard`.
5. O layout do dashboard confere o usuário de novo no servidor antes de
   mostrar a casca, e a função que entrega os dados do dashboard faz a mesma
   conferência. Um layout sozinho não impede a página de ser processada.
6. A action de sair encerra a sessão e redireciona para `/login`.

A identidade no servidor vem sempre de `supabase.auth.getClaims()`, nunca de
`getSession()`. Só a chave publicável do Supabase é usada, e apenas no
servidor: não existe cliente Supabase rodando no navegador.

A confirmação de e-mail fica desligada no projeto Supabase. O cadastro deixa a
pessoa logada e a leva direto ao dashboard.

### Cache Components

Com Cache Components ligado, três coisas mudam em relação a um app Next.js
tradicional:

- Ler a sessão só é permitido em tempo de requisição. `getCurrentUser()`
  chama `connection()` antes de validar a sessão e só é usado dentro de um
  `<Suspense>`.
- `app/page.tsx` não lê a sessão: redireciona para `/dashboard`, que confere a
  sessão. O proxy já trata `/` antes disso.
- O Next.js mantém a tela anterior montada e oculta depois de uma navegação.
  Por isso os campos dos formulários usam identificadores únicos (`useId`) e
  os formulários são limpos quando a tela é ocultada, para que uma senha
  digitada não fique guardada.

### Organização do código

| Caminho | Responsabilidade |
|---|---|
| `proxy.ts` | chama `updateSession` e define em quais caminhos o proxy roda |
| `lib/supabase/server.ts` | cliente Supabase para Server Components e actions |
| `lib/supabase/proxy.ts` | renovação da sessão e redirecionamentos, preservando cookies e cabeçalhos de cache |
| `lib/supabase/cookie-options.ts` | opções dos cookies de sessão (HTTP-only) |
| `lib/auth/schemas.ts` | esquemas Zod de login e cadastro |
| `lib/auth/errors.ts` | tradução dos erros do Supabase para mensagens em português |
| `lib/auth/routes.ts` | regra de redirecionamento por rota |
| `lib/auth/user.ts` | nome e e-mail de exibição a partir dos dados da sessão |
| `lib/auth/current-user.ts` | usuário logado, ou redirecionamento para `/login` |
| `lib/auth/form-state.ts` | formato do estado devolvido pelas actions |
| `lib/dashboard/sample-data.ts` | dados de exemplo, entregues só com sessão válida |
| `app/(auth)/actions.ts` | actions de entrar, cadastrar e sair |
| `app/(auth)/layout.tsx`, `login/`, `cadastro/` | telas de autenticação |
| `app/dashboard/` | layout da casca e página Visão geral |
| `app/not-found.tsx`, `error.tsx`, `global-error.tsx` | telas de erro em português |
| `components/auth/` | `LoginForm`, `SignupForm`, `FormField`, `SubmitButton`, `useClientValidation` |
| `components/dashboard/` | `Sidebar`, `Header`, `UserMenu`, `StatCard`, `RecentActivity` |
| `components/ui/` | componentes gerados pelo shadcn/ui |

Cada unidade tem uma responsabilidade. Os formulários não conhecem o Supabase:
chamam as actions e exibem o resultado. Os componentes do dashboard recebem os
dados por propriedades, então trocar os dados de exemplo por consultas reais
altera só `lib/dashboard/`.

## Telas

### Login

- Cartão centralizado com o nome do sistema (`Painel CRM`), campos de e-mail e
  senha e botão "Entrar".
- Link "Ainda não tem conta? Cadastre-se".
- Durante o envio, o botão fica desabilitado e mostra carregamento.

### Cadastro

- Mesmo visual, com nome, e-mail, senha e confirmação de senha, e botão
  "Criar conta".
- Link "Já tem conta? Entrar".

### Dashboard

- Menu lateral com logotipo e os itens Visão geral, Contatos, Funil de vendas,
  Tarefas e Relatórios. Só Visão geral é navegável; os outros aparecem como
  texto com a marca "em breve".
- Cabeçalho com o título da página e, à direita, o usuário com um menu que
  contém "Sair". Em telas pequenas aparece só o nome; o e-mail fica no menu.
- Conteúdo: saudação com o nome do usuário; quatro cartões (total de contatos,
  negócios em aberto, receita do mês, taxa de conversão); lista de atividades
  recentes.
- Um aviso visível informa que os números são dados de demonstração.
- Em telas pequenas, o menu lateral vira um painel aberto por um botão.

### Erros

- Endereço inexistente: "Página não encontrada", com link para o início.
- Erro inesperado: "Algo deu errado", com botão para tentar novamente.

## Validação

Um esquema Zod por formulário, aplicado no navegador para resposta imediata e
de novo no servidor, que é a autoridade.

- Nome: obrigatório, no máximo 100 caracteres.
- E-mail: formato válido. Espaços nas pontas e maiúsculas são normalizados.
- Senha, no cadastro: de 8 a 72 caracteres, e no máximo 72 bytes (o limite do
  bcrypt no Supabase; letras acentuadas ocupam mais de um byte).
- Senha, no login: apenas obrigatória, para não trancar contas criadas com
  outra regra.
- Confirmação: igual à senha.

Quando a validação no navegador falha, o foco vai para o primeiro campo
inválido, e cada mensagem fica associada ao seu campo para leitores de tela.

## Erros

| Situação | Mensagem |
|---|---|
| E-mail ou senha errados | "E-mail ou senha incorretos" (não indica qual dos dois) |
| E-mail já cadastrado | "Não foi possível criar a conta com este e-mail", com link para entrar |
| Campo inválido | mensagem abaixo do campo |
| Limite de tentativas do Supabase | "Muitas tentativas. Aguarde alguns minutos." |
| Senha recusada pelo Supabase como fraca | "Escolha uma senha mais forte" |
| E-mail recusado pelo Supabase | "Informe um e-mail válido" |
| Dados recusados pelo Supabase | "Verifique os dados informados" |
| Falha de rede ou Supabase indisponível | "Não foi possível conectar. Tente novamente." |
| Sessão expirada | redirecionamento para `/login` |

Toda tradução de erro do Supabase passa por `lib/auth/errors.ts`. Um erro não
mapeado vira a mensagem genérica de conexão; texto técnico em inglês nunca
chega à tela. Falhas inesperadas nas actions são registradas no console do
servidor.

Se a confirmação de e-mail for religada no Supabase, o cadastro mostra o aviso
"Conta criada. Confirme seu e-mail para entrar.".

Limitação conhecida: se as variáveis do Supabase faltarem em `.env.local`, o
proxy falha com a página de erro padrão do servidor, em inglês.

## Segurança

- Chaves em `.env.local`, fora do git, com um `.env.example` sem valores.
- Só a chave publicável do Supabase é usada. A chave de administrador não
  entra no projeto.
- Cookies de sessão HTTP-only: scripts da página não leem os tokens.
- Respostas que gravam a sessão levam os cabeçalhos que proíbem cache
  compartilhado, inclusive nos redirecionamentos.
- A senha nunca é devolvida ao navegador depois de um envio com erro.
- Hash de senha e limite de tentativas ficam com o Supabase.
- A proteção acontece no servidor, em três pontos: proxy, layout do dashboard
  e função de dados.

## Testes

Unitários (Vitest), em `lib/**/*.test.ts`, com `npm test`:

- Esquemas de validação: casos válidos e cada regra violada.
- Tradução de erros: cada erro mapeado e o caso não mapeado.
- Regra de redirecionamento por rota.
- Nome de exibição do usuário.
- `getCurrentUser`: redireciona sem sessão.
- Dados do dashboard: não são entregues sem sessão.
- Proxy: cookies, remoção de cookies e cabeçalhos de cache preservados.

Ponta a ponta (Playwright), em `e2e/`, com `npm run test:e2e`. A suíte gera
um build de produção e o serve na porta 3100, sem usar o servidor de
desenvolvimento. Roda contra o projeto Supabase real e cobre:

- Deslogado em `/dashboard`, em sub-rotas e em `/` vai para `/login`.
- Cadastro cria a conta e leva ao dashboard com o nome e o e-mail corretos.
- Sair bloqueia o dashboard, inclusive pelo botão "voltar".
- Login com senha errada mostra o erro, mantém o e-mail e limpa a senha.
- Login aceita e-mail com espaços e maiúsculas; logado em `/login` ou
  `/cadastro` vai para o dashboard.
- E-mail já cadastrado mostra o erro com link para entrar.
- Validação no navegador, foco e associação das mensagens aos campos.
- Erros e credenciais digitadas não ficam guardados ao sair ou trocar de tela.
- Cookies de sessão HTTP-only.
- Casca do dashboard em tela grande e pequena.
- Página não encontrada em português.

Cada execução cria cerca de quinze usuários com e-mails `e2e-…` únicos. A
limpeza é manual, pelo painel do Supabase (Authentication → Users), porque o
projeto não usa a chave de administrador. O domínio desses e-mails vem de
`E2E_EMAIL_DOMAIN` em `.env.local` (padrão `example.com`).

A página de erro inesperado e a página de erro global não têm teste
automatizado.

## Pré-requisitos externos

- Um projeto Supabase no plano gratuito, com a confirmação de e-mail desligada
  (Authentication → Sign In / Providers → Email → Confirm email).
- Node.js 24 instalado na máquina.
