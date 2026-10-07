import { expect, type Page } from "@playwright/test";

export type TestUser = { name: string; email: string; password: string };

export function newUser(): TestUser {
  const domain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: "Teste E2E",
    email: `e2e-${unique}@${domain}`,
    password: "senha-e2e-1234",
  };
}

// Next keeps previously visited routes in the DOM, hidden. Only match the
// field of the page on screen.
export function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}

export async function signUp(page: Page, user: TestUser) {
  await page.goto("/cadastro");
  await field(page, "Nome").fill(user.name);
  await field(page, "E-mail").fill(user.email);
  await field(page, "Senha").fill(user.password);
  await field(page, "Confirmar senha").fill(user.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Menu do usuário" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
}
