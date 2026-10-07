import { expect, test } from "@playwright/test";
import {
  field,
  newUser,
  sawDashboard,
  signOut,
  signUp,
  watchForDashboard,
} from "./helpers";

test("cadastro leva ao dashboard com o nome", async ({ page }) => {
  const user = newUser();
  await signUp(page, user);
  await expect(page.getByText(user.name).first()).toBeVisible();
  await expect(page.getByText(user.email).first()).toBeVisible();
});

test("sair bloqueia o dashboard", async ({ page }) => {
  await signUp(page, newUser());
  await signOut(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("voltar depois de sair não mostra o dashboard", async ({ page }) => {
  await signUp(page, newUser());
  await signOut(page);
  await watchForDashboard(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Olá,/ })).toBeHidden();
  // Not even for a moment on the way back to /login.
  expect(await sawDashboard(page)).toBe(false);
});

test("erro de login não reaparece depois de entrar e sair", async ({
  page,
}) => {
  const user = newUser();
  await signUp(page, user);
  await signOut(page);
  await field(page, "E-mail").fill(user.email);
  await field(page, "Senha").fill("senha-errada-999");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
  await field(page, "Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await signOut(page);
  await expect(page.getByText("E-mail ou senha incorretos")).toBeHidden();
  await expect(field(page, "E-mail")).toHaveValue("");
  await expect(field(page, "Senha")).toHaveValue("");
});

test("senha errada mostra erro e mantém o e-mail", async ({ page }) => {
  const user = newUser();
  await signUp(page, user);
  await signOut(page);
  await field(page, "E-mail").fill(user.email);
  await field(page, "Senha").fill("senha-errada-999");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
  await expect(field(page, "E-mail")).toHaveValue(user.email);
  await expect(field(page, "Senha")).toHaveValue("");
});

test("login correto entra e bloqueia /login", async ({ page }) => {
  const user = newUser();
  await signUp(page, user);
  await signOut(page);
  // Typed with spaces and capitals: must be normalised before sign-in.
  await field(page, "E-mail").fill(`  ${user.email.toUpperCase()} `);
  await field(page, "Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const path of ["/login", "/cadastro"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard$/);
  }
});

test("e-mail já cadastrado mostra erro com link para entrar", async ({
  page,
}) => {
  const user = newUser();
  await signUp(page, user);
  await signOut(page);
  await page.goto("/cadastro");
  await field(page, "Nome").fill(user.name);
  await field(page, "E-mail").fill(user.email);
  await field(page, "Senha").fill(user.password);
  await field(page, "Confirmar senha").fill(user.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(
    page.getByText("Não foi possível criar a conta com este e-mail"),
  ).toBeVisible();
  await expect(
    page.getByRole("alert").getByRole("link", { name: "Entrar" }),
  ).toBeVisible();
});

test("validação no navegador mostra erro abaixo do campo", async ({ page }) => {
  await page.goto("/cadastro");
  await field(page, "Nome").fill("Ana");
  await field(page, "E-mail").fill("ana@email.com");
  await field(page, "Senha").fill("1234567");
  await field(page, "Confirmar senha").fill("7654321");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(
    page.getByText("A senha deve ter no mínimo 8 caracteres"),
  ).toBeVisible();
  await expect(page.getByText("As senhas não coincidem")).toBeVisible();
  // Each error is tied to its field, and focus lands on the first invalid one.
  await expect(field(page, "Senha")).toHaveAccessibleDescription(
    "A senha deve ter no mínimo 8 caracteres",
  );
  await expect(field(page, "Confirmar senha")).toHaveAccessibleDescription(
    "As senhas não coincidem",
  );
  await expect(field(page, "Senha")).toBeFocused();
  // Scoped to the form: Next's own route announcer is also an alert.
  await expect(page.locator("form").getByRole("alert")).toHaveCount(0);
  await expect(page).toHaveURL(/\/cadastro$/);
  // Nothing the person typed is lost: they fix the field and resubmit.
  await expect(field(page, "Nome")).toHaveValue("Ana");
  await expect(field(page, "E-mail")).toHaveValue("ana@email.com");
  await expect(field(page, "Senha")).toHaveValue("1234567");
  await expect(field(page, "Confirmar senha")).toHaveValue("7654321");
});

test("corrigir o e-mail depois de um erro do servidor mantém o que foi digitado", async ({
  page,
}) => {
  await page.goto("/login");
  await field(page, "E-mail").fill("ninguem-cadastrado@example.com");
  await field(page, "Senha").fill("senha-qualquer-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();

  await field(page, "E-mail").fill("ainda-incompleto@");
  await field(page, "Senha").fill("senha-qualquer-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Informe um e-mail válido")).toBeVisible();
  await expect(field(page, "E-mail")).toHaveValue("ainda-incompleto@");
  await expect(field(page, "Senha")).toHaveValue("senha-qualquer-123");
});

test("a sessão fica em cookies que o JavaScript não lê", async ({
  page,
  context,
}) => {
  await signUp(page, newUser());
  const session = (await context.cookies()).filter((cookie) =>
    cookie.name.includes("auth-token"),
  );
  expect(session.length).toBeGreaterThan(0);
  for (const cookie of session) expect(cookie.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "auth-token",
  );
});

test("senha digitada e não enviada não fica guardada ao trocar de tela", async ({
  page,
}) => {
  await page.goto("/login");
  await field(page, "E-mail").fill("ana@email.com");
  await field(page, "Senha").fill("segredo-digitado-123");
  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  // The login screen may be kept in the page, hidden: no password field
  // anywhere in the document may still hold what was typed.
  expect(
    await page
      .locator('input[type="password"]')
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).not.toContain("segredo-digitado-123");

  await field(page, "Senha").fill("outra-senha-456");
  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(field(page, "Senha")).toHaveValue("");
  await expect(field(page, "E-mail")).toHaveValue("");
});

test("erro de login não reaparece ao ir para o cadastro e voltar", async ({
  page,
}) => {
  await page.goto("/login");
  await field(page, "E-mail").fill("ninguem-cadastrado@example.com");
  await field(page, "Senha").fill("senha-qualquer-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();

  await page.getByRole("link", { name: "Cadastre-se" }).click();
  await expect(page).toHaveURL(/\/cadastro$/);
  // Nothing of the failed attempt may wait in the hidden login screen.
  expect(
    await page
      .locator("input")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).not.toContain("ninguem-cadastrado@example.com");

  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("E-mail ou senha incorretos")).toBeHidden();
  await expect(field(page, "E-mail")).toHaveValue("");
});
