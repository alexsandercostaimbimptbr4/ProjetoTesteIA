# Login e casca do dashboard de CRM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicação web em que a pessoa cria conta com e-mail e senha, entra, vê uma casca de dashboard de CRM protegida e sai.

**Architecture:** Uma aplicação Next.js (App Router). Server Actions validam com Zod e chamam o Supabase Auth, que grava a sessão em cookies HTTP-only. O `proxy.ts` renova a sessão e redireciona a cada requisição; o layout do dashboard confere o usuário de novo no servidor.

**Tech Stack:** Next.js 16.4, TypeScript, `@supabase/ssr` 0.12 + `@supabase/supabase-js` 2, Tailwind CSS 4, shadcn/ui, Zod 4, Vitest 5, Playwright 1.64. Node 24, npm.

**Spec:** `docs/superpowers/specs/2026-10-07-login-dashboard-crm-design.md`

## Global Constraints

- Toda a interface e todas as mensagens de erro em português. Texto técnico em inglês nunca chega à tela.
- Nome do sistema exibido nas telas: `Painel CRM`.
- Só a chave pública do Supabase (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). A chave de administrador (service role / secret) não entra no projeto, nem nos testes.
- Chaves em `.env.local`, fora do git; `.env.example` sem valores.
- No servidor, a identidade vem sempre de `supabase.auth.getClaims()`. Nunca usar `getSession()` em código de servidor.
- O interceptador é `proxy.ts` na raiz, com a função exportada `proxy` (Next.js 16 renomeou `middleware`).
- Nenhuma tabela própria no banco. O nome do usuário fica em `user_metadata.full_name`.
- Sem diretório `src/`. Alias de importação `@/*` apontando para a raiz.
- Fora do escopo: recuperação de senha, confirmação de e-mail, login social, perfis de acesso, módulos reais do CRM, deploy.
- Commits terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. E-mail digitado com espaços ou maiúsculas (`"  Ana@Email.com "`): deve ser aceito e enviado como `ana@email.com`. Teste em Task 1.
2. Senha com mais de 72 caracteres (limite do bcrypt no Supabase): erro de campo em português, não erro genérico. Teste em Task 1.
3. Usuário sem `full_name` nos metadados (criado pelo painel do Supabase): o dashboard mostra a parte do e-mail antes do `@`, nunca `undefined`. Teste em Task 2.
4. Sub-rota do dashboard sem sessão (`/dashboard/contatos`): redireciona para `/login`, não só a rota exata. Testes em Task 2 (unitário) e Task 3 (ponta a ponta).
5. Erro do servidor no login: o e-mail digitado continua no campo e a senha é limpa. Teste em Task 4.

## Estrutura de arquivos

| Caminho | Responsabilidade |
|---|---|
| `proxy.ts` | chama `updateSession` e define o `matcher` |
| `lib/supabase/client.ts`, `server.ts`, `proxy.ts` | clientes Supabase (navegador, servidor) e renovação da sessão |
| `lib/auth/schemas.ts` | esquemas Zod de login e cadastro |
| `lib/auth/errors.ts` | tradução dos erros do Supabase |
| `lib/auth/routes.ts` | decisão de redirecionamento por rota |
| `lib/auth/user.ts` | nome e e-mail de exibição a partir das claims |
| `lib/auth/form-state.ts` | tipo do estado devolvido pelas actions |
| `lib/dashboard/sample-data.ts` | dados de exemplo |
| `app/(auth)/actions.ts` | actions `login`, `signup`, `logout` |
| `app/(auth)/layout.tsx`, `login/page.tsx`, `cadastro/page.tsx` | telas de autenticação |
| `app/dashboard/layout.tsx`, `page.tsx` | casca e Visão geral |
| `components/auth/` | `LoginForm`, `SignupForm` |
| `components/dashboard/` | `Sidebar`, `Header`, `UserMenu`, `StatCard`, `RecentActivity` |
| `e2e/` | testes Playwright e `helpers.ts` |

---

### Task 1: Projeto base e esquemas de validação

**Files:**
- Create: projeto Next.js na raiz, `vitest.config.ts`, `playwright.config.ts`, `.env.example`
- Create: `lib/auth/schemas.ts`
- Test: `lib/auth/schemas.test.ts`

**Interfaces:**
- Produces: `loginSchema`, `signupSchema` (Zod); tipos `LoginInput = { email: string; password: string }` e `SignupInput = { name: string; email: string; password: string; confirmPassword: string }`; scripts `npm test` (Vitest) e `npm run test:e2e` (Playwright).

- [ ] **Step 1: Configurar a identidade do git e commitar a spec**

O commit da spec está pendente porque o git não tem autor configurado. O parceiro humano define o nome; depois:

```bash
git add docs/superpowers
git commit -m "Add design spec and implementation plan"
```

- [ ] **Step 2: Gerar o projeto Next.js**

O `create-next-app` recusa a pasta atual: o nome `ProjetoTesteClaude` tem maiúsculas e a pasta não está vazia. Gerar em subpasta e mover para a raiz:

```bash
npx create-next-app@16.4 crm-dashboard --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --disable-git
```

Mover todo o conteúdo de `crm-dashboard/` (inclusive arquivos ocultos) para a raiz e apagar a subpasta. Acrescentar ao `.gitignore`: `.playwright-mcp/`, `test-results/`, `playwright-report/`. Confirmar que `.env*` está ignorado, com exceção de `.env.example`.

- [ ] **Step 3: Instalar dependências e shadcn/ui**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @playwright/test
npx playwright install chromium
npx shadcn@latest init -d
npx shadcn@latest add button input label card dropdown-menu sheet avatar badge
```

- [ ] **Step 4: Tema pela preferência do sistema**

Em `app/globals.css`, trocar a variante de classe do shadcn por media query: `@custom-variant dark (@media (prefers-color-scheme: dark));` e mover as variáveis do bloco `.dark { … }` para `@media (prefers-color-scheme: dark) { :root { … } }`. Não instalar `next-themes`.

- [ ] **Step 5: Configurar os testes**

- `vitest.config.ts`: ambiente `node`, `include: ['lib/**/*.test.ts']`, alias `@` para a raiz.
- `playwright.config.ts`: `testDir: 'e2e'`, `baseURL: 'http://localhost:3000'`, só o projeto `chromium`, `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }`.
- `package.json`: `"test": "vitest run"`, `"test:e2e": "playwright test"`.
- `.env.example` com `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` e `E2E_EMAIL_DOMAIN=example.com`.

- [ ] **Step 6: Escrever os testes dos esquemas (falhando)**

`lib/auth/schemas.test.ts`:

```ts
const valid = { name: 'Ana Souza', email: 'ana@email.com', password: 'senha1234', confirmPassword: 'senha1234' }
const firstError = (r: { success: boolean; error?: any }, field: string) =>
  r.error.flatten().fieldErrors[field][0]

describe('signupSchema', () => {
  it('aceita dados válidos', () => expect(signupSchema.safeParse(valid).success).toBe(true))
  it('normaliza o e-mail', () =>
    expect(signupSchema.parse({ ...valid, email: '  Ana@Email.com ' }).email).toBe('ana@email.com'))
  it('remove espaços do nome', () =>
    expect(signupSchema.parse({ ...valid, name: '  Ana  ' }).name).toBe('Ana'))
  it('exige nome', () =>
    expect(firstError(signupSchema.safeParse({ ...valid, name: '   ' }), 'name')).toBe('Informe seu nome'))
  it('rejeita e-mail inválido', () =>
    expect(firstError(signupSchema.safeParse({ ...valid, email: 'ana@' }), 'email')).toBe('Informe um e-mail válido'))
  it('exige 8 caracteres na senha', () =>
    expect(firstError(signupSchema.safeParse({ ...valid, password: '1234567', confirmPassword: '1234567' }), 'password'))
      .toBe('A senha deve ter no mínimo 8 caracteres'))
  it('limita a senha a 72 caracteres', () => {
    const long = 'a'.repeat(73)
    expect(firstError(signupSchema.safeParse({ ...valid, password: long, confirmPassword: long }), 'password'))
      .toBe('A senha deve ter no máximo 72 caracteres')
  })
  it('não altera espaços da senha', () =>
    expect(signupSchema.parse({ ...valid, password: ' senha123 ', confirmPassword: ' senha123 ' }).password).toBe(' senha123 '))
  it('exige confirmação igual', () =>
    expect(firstError(signupSchema.safeParse({ ...valid, confirmPassword: 'outra1234' }), 'confirmPassword'))
      .toBe('As senhas não coincidem'))
})

describe('loginSchema', () => {
  it('normaliza o e-mail', () =>
    expect(loginSchema.parse({ email: ' Ana@Email.com', password: 'x' }).email).toBe('ana@email.com'))
  it('exige senha, sem regra de tamanho', () => {
    expect(loginSchema.safeParse({ email: 'ana@email.com', password: 'x' }).success).toBe(true)
    expect(firstError(loginSchema.safeParse({ email: 'ana@email.com', password: '' }), 'password')).toBe('Informe sua senha')
  })
})
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npm test` — Expected: FAIL, `schemas` não existe.

- [ ] **Step 8: Implementar `loginSchema` e `signupSchema` em `lib/auth/schemas.ts`**

E-mail: `trim` e minúsculas antes de validar. O login não aplica a regra de 8 caracteres: contas antigas com outra regra não podem ficar trancadas fora. Exportar `LoginInput` e `SignupInput` com `z.infer`.

- [ ] **Step 9: Verificar**

Run: `npm test` — Expected: PASS, 11 testes. Run: `npm run build` — Expected: build concluído sem erros.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app and add auth validation schemas"
```

---

### Task 2: Tradução de erros, regras de rota e dados do usuário

**Files:**
- Create: `lib/auth/errors.ts`, `lib/auth/routes.ts`, `lib/auth/user.ts`
- Test: `lib/auth/errors.test.ts`, `lib/auth/routes.test.ts`, `lib/auth/user.test.ts`

**Interfaces:**
- Produces:
  - `translateAuthError(error: unknown, context: 'login' | 'signup'): string`
  - `resolveRedirect(pathname: string, isAuthenticated: boolean): string | null`
  - `getDisplayUser(claims: { email?: string; user_metadata?: { full_name?: unknown } } | null | undefined): { name: string; email: string }`

- [ ] **Step 1: Escrever os testes (falhando)**

`lib/auth/errors.test.ts`:

```ts
const GENERIC = 'Não foi possível conectar. Tente novamente.'
it.each([
  [{ code: 'invalid_credentials' }, 'login', 'E-mail ou senha incorretos'],
  [{ code: 'user_already_exists' }, 'signup', 'Não foi possível criar a conta com este e-mail'],
  [{ code: 'email_exists' }, 'signup', 'Não foi possível criar a conta com este e-mail'],
  [{ code: 'over_request_rate_limit' }, 'login', 'Muitas tentativas. Aguarde alguns minutos.'],
  [{ status: 429 }, 'signup', 'Muitas tentativas. Aguarde alguns minutos.'],
  [{ code: 'unexpected_failure', message: 'Database error' }, 'login', GENERIC],
  [new TypeError('fetch failed'), 'login', GENERIC],
  [null, 'signup', GENERIC],
])('traduz %o em %s', (error, context, expected) =>
  expect(translateAuthError(error, context as 'login' | 'signup')).toBe(expected))
```

`lib/auth/routes.test.ts`:

```ts
it.each([
  ['/dashboard', false, '/login'],
  ['/dashboard/contatos', false, '/login'],
  ['/login', false, null],
  ['/cadastro', false, null],
  ['/', false, '/login'],
  ['/login', true, '/dashboard'],
  ['/cadastro', true, '/dashboard'],
  ['/', true, '/dashboard'],
  ['/dashboard', true, null],
  ['/dashboard/contatos', true, null],
  ['/dashboardx', false, null],
])('%s autenticado=%s -> %s', (path, auth, expected) =>
  expect(resolveRedirect(path, auth)).toBe(expected))
```

`lib/auth/user.test.ts`:

```ts
it('usa o nome dos metadados', () =>
  expect(getDisplayUser({ email: 'ana@email.com', user_metadata: { full_name: 'Ana Souza' } }))
    .toEqual({ name: 'Ana Souza', email: 'ana@email.com' }))
it('sem nome, usa o início do e-mail', () =>
  expect(getDisplayUser({ email: 'ana@email.com', user_metadata: {} }).name).toBe('ana'))
it('nome em branco ou não texto cai no e-mail', () => {
  expect(getDisplayUser({ email: 'ana@email.com', user_metadata: { full_name: '  ' } }).name).toBe('ana')
  expect(getDisplayUser({ email: 'ana@email.com', user_metadata: { full_name: 42 } }).name).toBe('ana')
})
it('sem claims devolve valores neutros', () =>
  expect(getDisplayUser(null)).toEqual({ name: 'Usuário', email: '' }))
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` — Expected: FAIL nos três arquivos novos.

- [ ] **Step 3: Implementar as três funções**

`translateAuthError` lê `code` e `status` do erro sem assumir o formato; o parâmetro `context` existe para a action escolher o formulário, e hoje nenhuma mensagem muda por ele. `resolveRedirect` trata `/dashboard` como prefixo de segmento (`/dashboard` ou `/dashboard/…`), não de texto.

- [ ] **Step 4: Verificar**

Run: `npm test` — Expected: PASS, 34 testes no total.

- [ ] **Step 5: Commit**

```bash
git add lib/auth
git commit -m "feat: add auth error translation, route rules and display user"
```

---

### Task 3: Projeto Supabase, sessão e proteção de rotas

**Files:**
- Create: `.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts`
- Create (provisórios, substituídos nas Tasks 4 e 5): `app/(auth)/login/page.tsx`, `app/(auth)/cadastro/page.tsx`, `app/dashboard/page.tsx`
- Modify: `app/page.tsx`
- Test: `e2e/protecao.spec.ts`

**Interfaces:**
- Consumes: `resolveRedirect` (Task 2).
- Produces:
  - `createClient(): SupabaseClient` em `lib/supabase/client.ts` (navegador)
  - `createClient(): Promise<SupabaseClient>` em `lib/supabase/server.ts` (servidor; `cookies()` é assíncrono no Next 16)
  - `updateSession(request: NextRequest): Promise<NextResponse>` em `lib/supabase/proxy.ts`

- [ ] **Step 1: Criar o projeto Supabase (precisa de confirmação do parceiro humano)**

Pelas ferramentas MCP do Supabase: listar organizações, consultar e confirmar o custo (plano gratuito) e criar o projeto `crm-dashboard` na região `sa-east-1`. Gravar a URL e a chave publicável em `.env.local`.

O parceiro humano desliga a confirmação de e-mail no painel: Authentication → Sign In / Providers → Email → "Confirm email" desligado. Não há ferramenta MCP para isso.

- [ ] **Step 2: Escrever o teste de ponta a ponta (falhando)**

`e2e/protecao.spec.ts`:

```ts
for (const path of ['/dashboard', '/dashboard/contatos', '/']) {
  test(`deslogado em ${path} vai para /login`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  })
}
test('deslogado acessa /cadastro', async ({ page }) => {
  await page.goto('/cadastro')
  await expect(page).toHaveURL(/\/cadastro$/)
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm run test:e2e` — Expected: FAIL, as rotas não existem.

- [ ] **Step 4: Implementar os clientes Supabase e `updateSession`**

Seguir o guia oficial "Creating a Supabase client for SSR" (`https://supabase.com/docs/guides/auth/server-side/creating-a-client`), aba Next.js: `createBrowserClient` e `createServerClient` com `cookies: { getAll, setAll }`.

`updateSession` chama `getClaims()`, passa `pathname` e a presença de claims para `resolveRedirect` e, quando houver destino, devolve `NextResponse.redirect`. A resposta de redirecionamento precisa receber os cookies que o Supabase gravou na resposta original; sem isso a sessão renovada se perde.

- [ ] **Step 5: Criar `proxy.ts` e as páginas provisórias**

`proxy.ts` exporta `proxy(request)` chamando `updateSession`, com o `matcher` do guia oficial (exclui `_next/static`, `_next/image`, `favicon.ico` e imagens). As três páginas provisórias mostram só um título. `app/page.tsx` redireciona conforme `getClaims()`, para o caso de o proxy não ter rodado.

- [ ] **Step 6: Verificar**

Run: `npm run test:e2e` — Expected: PASS, 4 testes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase session handling and route protection"
```

---

### Task 4: Cadastro, login e logout

**Files:**
- Create: `lib/auth/form-state.ts`, `app/(auth)/actions.ts`, `app/(auth)/layout.tsx`, `components/auth/login-form.tsx`, `components/auth/signup-form.tsx`, `e2e/helpers.ts`
- Modify: `app/(auth)/login/page.tsx`, `app/(auth)/cadastro/page.tsx`, `app/dashboard/page.tsx`
- Test: `e2e/auth.spec.ts`

**Interfaces:**
- Consumes: `loginSchema`, `signupSchema` (Task 1); `translateAuthError`, `getDisplayUser` (Task 2); `createClient` do servidor (Task 3).
- Produces:
  - `type AuthFormState = { message?: string; fieldErrors?: Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>; values?: { name?: string; email?: string } }`
  - `login(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`
  - `signup(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`
  - `logout(): Promise<void>`
  - `e2e/helpers.ts`: `newUser(): { name: string; email: string; password: string }`, `signUp(page, user): Promise<void>`, `signOut(page): Promise<void>`

- [ ] **Step 1: Escrever os testes de ponta a ponta (falhando)**

`e2e/helpers.ts`: `newUser()` devolve nome `Teste E2E`, senha `senha-e2e-1234` e e-mail `e2e-${Date.now()}-${aleatório}@${process.env.E2E_EMAIL_DOMAIN ?? 'example.com'}`. `signUp` preenche `/cadastro` e espera `/dashboard`. `signOut` clica no botão "Sair" e espera `/login`.

`e2e/auth.spec.ts`:

```ts
test('cadastro leva ao dashboard com o nome', async ({ page }) => {
  const user = newUser()
  await signUp(page, user)
  await expect(page.getByText(user.name).first()).toBeVisible()
  await expect(page.getByText(user.email).first()).toBeVisible()
})

test('sair bloqueia o dashboard', async ({ page }) => {
  await signUp(page, newUser())
  await signOut(page)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('senha errada mostra erro e mantém o e-mail', async ({ page }) => {
  const user = newUser()
  await signUp(page, user)
  await signOut(page)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill('senha-errada-999')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toHaveValue(user.email)
  await expect(page.getByLabel('Senha')).toHaveValue('')
})

test('login correto entra e bloqueia /login', async ({ page }) => {
  const user = newUser()
  await signUp(page, user)
  await signOut(page)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('e-mail já cadastrado mostra erro com link para entrar', async ({ page }) => {
  const user = newUser()
  await signUp(page, user)
  await signOut(page)
  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill(user.name)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByLabel('Confirmar senha').fill(user.password)
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('Não foi possível criar a conta com este e-mail')).toBeVisible()
  await expect(page.getByRole('alert').getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('validação no navegador mostra erro abaixo do campo', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Ana')
  await page.getByLabel('E-mail').fill('ana@email.com')
  await page.getByLabel('Senha', { exact: true }).fill('1234567')
  await page.getByLabel('Confirmar senha').fill('7654321')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('A senha deve ter no mínimo 8 caracteres')).toBeVisible()
  await expect(page.getByText('As senhas não coincidem')).toBeVisible()
  await expect(page).toHaveURL(/\/cadastro$/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:e2e` — Expected: FAIL nos 6 testes de `auth.spec.ts`.

Se o cadastro devolver `email_address_invalid`, o Supabase recusou o domínio de teste: definir `E2E_EMAIL_DOMAIN` com um domínio real e repetir.

- [ ] **Step 3: Implementar as actions em `app/(auth)/actions.ts`**

- Ambas validam com o esquema; se inválido, devolvem `fieldErrors` (primeira mensagem de cada campo) e `values`.
- `signup` chama `auth.signUp({ email, password, options: { data: { full_name: name } } })`.
- Erro do Supabase ou exceção de rede: devolver `{ message: translateAuthError(error, contexto), values }`. `values` nunca contém senha.
- Sucesso: `revalidatePath('/', 'layout')` e `redirect('/dashboard')`. O `redirect` fica fora do `try/catch`, porque funciona lançando uma exceção.
- `logout` chama `auth.signOut()`, revalida e redireciona para `/login`.

- [ ] **Step 4: Implementar os formulários e as páginas**

- `LoginForm` e `SignupForm` são Client Components com `useActionState`. No `onSubmit`, validam com o mesmo esquema; se inválido, `preventDefault()` e erros de campo; se válido, a action segue.
- Campos, rótulos e textos exatos: login com `E-mail`, `Senha`, botão `Entrar`, link `Ainda não tem conta? Cadastre-se`; cadastro com `Nome`, `E-mail`, `Senha`, `Confirmar senha`, botão `Criar conta`, link `Já tem conta? Entrar`.
- Enquanto envia, o botão fica desabilitado com indicador de carregamento.
- `message` aparece em um elemento `role="alert"`. No cadastro, quando a mensagem for a de e-mail já usado, o alerta inclui um link `Entrar` para `/login`.
- Os campos de nome e e-mail usam `values` como `defaultValue`; os de senha nunca recebem valor.
- `app/(auth)/layout.tsx`: cartão centralizado com o título `Painel CRM`.
- `app/dashboard/page.tsx` (ainda provisório): busca as claims, redireciona para `/login` se não houver, mostra nome e e-mail via `getDisplayUser` e um `<form action={logout}>` com o botão `Sair`.

- [ ] **Step 5: Verificar**

Run: `npm run test:e2e` — Expected: PASS, 10 testes. Run: `npm test` — Expected: PASS, 34 testes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add signup, login and logout flows"
```

---

### Task 5: Casca do dashboard

**Files:**
- Create: `lib/dashboard/sample-data.ts`, `app/dashboard/layout.tsx`, `components/dashboard/sidebar.tsx`, `header.tsx`, `user-menu.tsx`, `stat-card.tsx`, `recent-activity.tsx`
- Modify: `app/dashboard/page.tsx`, `e2e/helpers.ts` (`signOut`), `app/layout.tsx` (metadados e `lang="pt-BR"`)
- Test: `e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: `getDisplayUser` (Task 2); `createClient` do servidor (Task 3); `logout` (Task 4).
- Produces:
  - `type Stat = { id: string; label: string; value: string; change: string }`
  - `type Activity = { id: string; description: string; when: string }`
  - `getDashboardData(): { stats: Stat[]; activities: Activity[] }`
  - Props: `Sidebar()`, `Header({ title, user })`, `UserMenu({ user })`, `StatCard({ stat })`, `RecentActivity({ activities })`, com `user: { name: string; email: string }`

- [ ] **Step 1: Escrever o teste de ponta a ponta (falhando)**

`e2e/dashboard.spec.ts`:

```ts
test('mostra a casca do CRM', async ({ page }) => {
  const user = newUser()
  await signUp(page, user)
  await expect(page.getByRole('heading', { name: `Olá, ${user.name}` })).toBeVisible()
  for (const label of ['Total de contatos', 'Negócios em aberto', 'Receita do mês', 'Taxa de conversão'])
    await expect(page.getByText(label)).toBeVisible()
  await expect(page.getByText('Dados de demonstração')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Atividades recentes' })).toBeVisible()
  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')
  for (const item of ['Contatos', 'Funil de vendas', 'Tarefas', 'Relatórios']) {
    await expect(nav.getByText(item)).toBeVisible()
    await expect(nav.getByRole('link', { name: item })).toHaveCount(0)
  }
  await expect(nav.getByText('em breve')).toHaveCount(4)
})

test('em tela pequena o menu abre por um botão', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await signUp(page, newUser())
  await expect(page.getByRole('navigation')).toBeHidden()
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(page.getByRole('navigation').getByText('Funil de vendas')).toBeVisible()
})
```

Atualizar `signOut` em `e2e/helpers.ts`: abrir o menu do usuário (botão com nome acessível `Menu do usuário`) e clicar no item `Sair`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:e2e` — Expected: FAIL em `dashboard.spec.ts` e nos testes que usam `signOut`.

- [ ] **Step 3: Implementar `getDashboardData` em `lib/dashboard/sample-data.ts`**

Quatro indicadores, nesta ordem: `Total de contatos` `1.248`, `Negócios em aberto` `37`, `Receita do mês` `R$ 84.500`, `Taxa de conversão` `23%`, cada um com uma variação de exemplo (como `+12% no mês`). Cinco atividades de exemplo em português.

- [ ] **Step 4: Implementar o layout e os componentes**

- `app/dashboard/layout.tsx` (Server Component): busca as claims, redireciona para `/login` se não houver, e monta `Sidebar` + `Header` + conteúdo. É a segunda camada de proteção exigida pela spec.
- `Sidebar`: `<nav>` com o logotipo `Painel CRM`. `Visão geral` é link para `/dashboard` com `aria-current="page"`. Os outros quatro itens são texto não clicável com `aria-disabled="true"` e um `Badge` `em breve`.
- Em telas abaixo de `md`, a barra lateral fica oculta e o `Header` mostra um botão `Abrir menu` que abre a mesma `Sidebar` dentro de um `Sheet`.
- `Header`: título `Visão geral` à esquerda e `UserMenu` à direita.
- `UserMenu`: gatilho com nome acessível `Menu do usuário`, mostrando avatar com iniciais, nome e e-mail; item `Sair` que envia um formulário com a action `logout`.
- `app/dashboard/page.tsx`: título `Olá, {name}`, aviso `Dados de demonstração`, grade com quatro `StatCard`, e `RecentActivity` com o título `Atividades recentes`.
- `app/layout.tsx`: `lang="pt-BR"`, título `Painel CRM`.

- [ ] **Step 5: Verificar tudo**

Run: `npm run test:e2e` — Expected: PASS, 12 testes. Run: `npm test` — Expected: PASS, 34 testes. Run: `npm run lint` e `npm run build` — Expected: sem erros.

Abrir `http://localhost:3000` e conferir as três telas nos temas claro e escuro.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add CRM dashboard shell with sample data"
```

---

## Depois da implementação

Os testes de ponta a ponta deixam usuários `e2e-…` no projeto Supabase. A limpeza é manual, em Authentication → Users, porque o projeto não usa a chave de administrador.
