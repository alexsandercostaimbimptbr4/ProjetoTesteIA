import { expect, test } from "@playwright/test";
import { field, newUser } from "./helpers";

// The full path needs the e-mail Supabase sends, which the suite cannot
// read. These tests cover everything up to and around it. None of them
// creates an account or makes Supabase send a message.

test("o login leva à recuperação de senha", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/recuperar-senha$/);
  await expect(field(page, "E-mail")).toBeVisible();
  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("pedido de recuperação valida o e-mail no navegador", async ({ page }) => {
  await page.goto("/recuperar-senha");
  await field(page, "E-mail").fill("sem-arroba");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText("Informe um e-mail válido")).toBeVisible();
  await expect(field(page, "E-mail")).toBeFocused();
  await expect(field(page, "E-mail")).toHaveValue("sem-arroba");
});

test("pedido para e-mail desconhecido recebe o aviso neutro", async ({
  page,
}) => {
  await page.goto("/recuperar-senha");
  // An address no account uses: Supabase accepts the request and sends
  // nothing.
  await field(page, "E-mail").fill(newUser().email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha.",
  );
  await expect(field(page, "E-mail")).toHaveValue("");
});

test("nova senha sem link pede um novo", async ({ page }) => {
  await page.goto("/redefinir-senha");
  await expect(
    page.getByText("Este link expirou ou já foi usado"),
  ).toBeVisible();
  await expect(field(page, "Nova senha")).toHaveCount(0);
  await page.getByRole("link", { name: "Pedir um novo link" }).click();
  await expect(page).toHaveURL(/\/recuperar-senha$/);
});

test("nova senha valida os campos no navegador", async ({ page }) => {
  await page.goto("/redefinir-senha?token_hash=link-de-teste");
  await field(page, "Nova senha").fill("curta");
  await field(page, "Confirmar nova senha").fill("curta");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(
    page.getByText("A senha deve ter no mínimo 8 caracteres"),
  ).toBeVisible();

  await field(page, "Nova senha").fill("senha-nova-1234");
  await field(page, "Confirmar nova senha").fill("senha-outra-1234");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText("As senhas não coincidem")).toBeVisible();
});

test("link inválido mostra o erro, não abre sessão e não guarda a senha", async ({
  page,
}) => {
  await page.goto("/redefinir-senha?token_hash=link-de-teste");
  await field(page, "Nova senha").fill("senha-nova-1234");
  await field(page, "Confirmar nova senha").fill("senha-nova-1234");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(
    page.getByText("Este link expirou ou já foi usado"),
  ).toBeVisible();
  await field(page, "Nova senha").fill("senha-digitada-1234");
  await page.getByRole("link", { name: "Pedir um novo link" }).click();
  await expect(page).toHaveURL(/\/recuperar-senha$/);

  // Back on the hidden screen, neither the error nor what was typed remains.
  await page.goBack();
  await expect(page).toHaveURL(/\/redefinir-senha\?token_hash=/);
  await expect(field(page, "Nova senha")).toHaveValue("");
  await expect(field(page, "Confirmar nova senha")).toHaveValue("");
  await expect(
    page.getByText("Este link expirou ou já foi usado"),
  ).toHaveCount(0);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
