import { expect, test } from "@playwright/test";

for (const path of ["/dashboard", "/dashboard/contatos", "/"]) {
  test(`deslogado em ${path} vai para /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("deslogado acessa /cadastro", async ({ page }) => {
  await page.goto("/cadastro");
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByRole("heading", { name: "Criar conta" })).toBeVisible();
});
