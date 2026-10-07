# Login e casca do dashboard de CRM — Design

Data: 2026-10-07
Status: aguardando revisão

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
- Execução local.

Fora:

- Recuperação de senha e confirmação de e-mail.
- Login social.
- Perfis de acesso (admin, usuário comum).
- Módulos reais do CRM (contatos, funil, tarefas, relatórios).
- Publicação na internet.

## Stack

- Next.js (App Router) com TypeScript.
- Supabase Auth para usuários e sessão, via `@supabase/ssr`.
- Tailwind CSS e shadcn/ui para a interface.
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
3. O Supabase devolve a sessão, gravada em cookies HTTP-only.
4. A cada requisição, um interceptador no servidor renova a sessão e aplica os
   redirecionamentos: deslogado em `/dashboard` vai para `/login`; logado em
   `/login` ou `/cadastro` vai para `/dashboard`.
5. O layout do dashboard confere o usuário de novo no servidor antes de
   renderizar, para não depender só do interceptador.
6. A action de sair encerra a sessão e redireciona para `/login`.

A confirmação de e-mail fica desligada no projeto Supabase. O cadastro deixa a
pessoa logada e a leva direto ao dashboard.

O nome do arquivo do interceptador (`middleware.ts` ou `proxy.ts`) depende da
versão do Next.js instalada e é definido no plano de implementação, conforme a
documentação atual.

### Organização do código

| Caminho | Responsabilidade |
|---|---|
| `lib/supabase/` | criação dos clientes Supabase (servidor e navegador) e renovação da sessão |
| `lib/auth/schemas.ts` | esquemas Zod de login e cadastro |
| `lib/auth/errors.ts` | tradução dos erros do Supabase para mensagens em português |
| `lib/dashboard/sample-data.ts` | dados de exemplo dos cartões e das atividades |
| `app/(auth)/login/`, `app/(auth)/cadastro/` | páginas de login e cadastro |
| `app/(auth)/actions.ts` | actions de entrar, cadastrar e sair |
| `app/dashboard/` | layout da casca e página Visão geral |
| `components/auth/` | `LoginForm`, `SignupForm` |
| `components/dashboard/` | `Sidebar`, `Header`, `UserMenu`, `StatCard`, `RecentActivity` |

Cada unidade tem uma responsabilidade. Os formulários não conhecem o Supabase:
chamam as actions e exibem o resultado. Os componentes do dashboard recebem os
dados por propriedades, então trocar os dados de exemplo por consultas reais
altera só `lib/dashboard/`.

## Telas

### Login

- Cartão centralizado com o nome do sistema, campos de e-mail e senha e botão
  "Entrar".
- Link "Ainda não tem conta? Cadastre-se".
- Durante o envio, o botão fica desabilitado e mostra carregamento.

### Cadastro

- Mesmo visual, com nome, e-mail, senha e confirmação de senha, e botão
  "Criar conta".
- Link "Já tem conta? Entrar".

### Dashboard

- Menu lateral com logotipo e os itens Visão geral, Contatos, Funil de vendas,
  Tarefas e Relatórios. Só Visão geral é navegável; os outros aparecem
  desabilitados com a marca "em breve".
- Cabeçalho com o título da página e, à direita, nome e e-mail do usuário com
  um menu que contém "Sair".
- Conteúdo: saudação com o nome do usuário; quatro cartões (total de contatos,
  negócios em aberto, receita do mês, taxa de conversão); lista de atividades
  recentes.
- Um aviso visível informa que os números são dados de demonstração.
- Em telas pequenas, o menu lateral vira um painel aberto por um botão.

## Validação

Um esquema Zod por formulário, aplicado no navegador para resposta imediata e
de novo no servidor, que é a autoridade.

- Nome: obrigatório.
- E-mail: formato válido.
- Senha: no mínimo 8 caracteres.
- Confirmação: igual à senha.

## Erros

| Situação | Mensagem |
|---|---|
| E-mail ou senha errados | "E-mail ou senha incorretos" (não indica qual dos dois) |
| E-mail já cadastrado | "Não foi possível criar a conta com este e-mail", com link para entrar |
| Campo inválido | mensagem abaixo do campo |
| Limite de tentativas do Supabase | "Muitas tentativas. Aguarde alguns minutos." |
| Falha de rede ou Supabase indisponível | "Não foi possível conectar. Tente novamente." |
| Sessão expirada | redirecionamento para `/login` |

Toda tradução de erro do Supabase passa por `lib/auth/errors.ts`. Um erro não
mapeado vira a mensagem genérica de conexão; texto técnico em inglês nunca
chega à tela.

## Segurança

- Chaves em `.env.local`, fora do git, com um `.env.example` sem valores.
- Só a chave pública do Supabase é usada. A chave de administrador não entra no
  projeto.
- Hash de senha, cookies de sessão e limite de tentativas ficam com o Supabase.
- A proteção de rotas acontece no servidor, em duas camadas (interceptador e
  layout do dashboard).

## Testes

Unitários (Vitest):

- Esquemas de validação: casos válidos e cada regra violada.
- Tradução de erros: cada erro mapeado e o caso não mapeado.

Ponta a ponta (Playwright), contra o projeto Supabase real:

1. Deslogado em `/dashboard` é redirecionado para `/login`.
2. Cadastro cria a conta e leva ao dashboard com o nome correto.
3. Sair leva a `/login`, e `/dashboard` volta a ser inacessível.
4. Login com senha errada mostra "E-mail ou senha incorretos".
5. Login correto leva ao dashboard, e logado em `/login` é redirecionado para
   `/dashboard`.

Os testes criam usuários com e-mails descartáveis únicos por execução. A
limpeza desses usuários é manual, pelo painel do Supabase, porque o projeto não
usa a chave de administrador.

## Pré-requisitos externos

- Um projeto Supabase no plano gratuito, com a confirmação de e-mail desligada.
- Node.js instalado na máquina.
