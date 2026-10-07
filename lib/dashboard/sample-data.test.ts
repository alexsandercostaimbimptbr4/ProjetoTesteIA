import { beforeEach, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ valid: true }));

// getCurrentUser() redirects by throwing when there is no session.
vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: async () => {
    if (!session.valid) throw new Error("sem sessão");
    return { name: "Ana", email: "ana@email.com" };
  },
}));

import { getDashboardData } from "./sample-data";

beforeEach(() => {
  session.valid = true;
});

it("não entrega dados sem sessão", async () => {
  session.valid = false;
  await expect(getDashboardData()).rejects.toThrow("sem sessão");
});

it("entrega os quatro indicadores e as atividades com sessão", async () => {
  const data = await getDashboardData();
  expect(data.stats.map((stat) => stat.label)).toEqual([
    "Total de contatos",
    "Negócios em aberto",
    "Receita do mês",
    "Taxa de conversão",
  ]);
  expect(data.activities).toHaveLength(5);
});
