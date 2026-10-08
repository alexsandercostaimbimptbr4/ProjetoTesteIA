import { expect, test } from "@playwright/test";

// The last two only end in the letters of an image extension: the proxy must
// still handle them (it skips real image files such as /logo.png).
for (const path of [
  "/dashboard",
  "/dashboard/contatos",
  "/",
  "/dashboard/svg",
  "/dashboard/xpng",
]) {
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
