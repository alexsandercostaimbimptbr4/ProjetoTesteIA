import { expect, test } from "@playwright/test";
import { field, newUser, signOut, signUp } from "./helpers";

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
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Olá,/ })).toBeHidden();
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
  await expect(
    page.getByRole("alert").filter({ hasText: "As senhas não coincidem" }),
  ).toBeVisible();
  await expect(field(page, "Senha")).toBeFocused();
  await expect(page).toHaveURL(/\/cadastro$/);
});
