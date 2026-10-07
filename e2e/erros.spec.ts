import { expect, test } from "@playwright/test";

test("página inexistente mostra aviso em português", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voltar ao início" }),
  ).toBeVisible();
});
