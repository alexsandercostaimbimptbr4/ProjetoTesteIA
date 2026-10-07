import { expect, type Page } from "@playwright/test";

export type TestUser = { name: string; email: string; password: string };

export function newUser(): TestUser {
  const domain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `Teste ${unique.slice(-6)}`,
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

// Records whether the dashboard greeting is ever on screen from now on, even
// briefly. Survives client-side navigations; a full reload clears it, and then
// the proxy has already redirected before anything rendered.
export async function watchForDashboard(page: Page) {
  await page.evaluate(() => {
    const state = window as unknown as { sawDashboard?: boolean };
    state.sawDashboard = false;
    const check = () => {
      for (const heading of document.querySelectorAll("h1")) {
        if (
          heading.textContent?.startsWith("Olá,") &&
          heading.checkVisibility()
        ) {
          state.sawDashboard = true;
        }
      }
    };
    new MutationObserver(check).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });
  });
}

// Returns undefined when the observer was lost (a full reload), so a strict
// `toBe(false)` fails loudly instead of passing by accident.
export async function sawDashboard(page: Page): Promise<boolean | undefined> {
  return page.evaluate(
    () => (window as unknown as { sawDashboard?: boolean }).sawDashboard,
  );
}
