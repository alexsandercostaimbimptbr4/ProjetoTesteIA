import { expect, test } from "@playwright/test";
import { newUser, signUp } from "./helpers";

test("mostra a casca do CRM", async ({ page }) => {
  const user = newUser();
  await signUp(page, user);
  await expect(
    page.getByRole("heading", { name: `Olá, ${user.name}` }),
  ).toBeVisible();
  for (const label of [
    "Total de contatos",
    "Negócios em aberto",
    "Receita do mês",
    "Taxa de conversão",
  ]) {
    await expect(page.getByText(label)).toBeVisible();
  }
  await expect(page.getByText("Dados de demonstração")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atividades recentes" }),
  ).toBeVisible();

  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("link", { name: "Visão geral" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  for (const item of ["Contatos", "Funil de vendas", "Tarefas", "Relatórios"]) {
    await expect(nav.getByText(item, { exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: item })).toHaveCount(0);
  }
  await expect(nav.getByText("em breve")).toHaveCount(4);
});

test("em tela pequena o menu abre por um botão", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await signUp(page, newUser());
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(
    page.getByRole("navigation").getByText("Funil de vendas"),
  ).toBeVisible();
});
