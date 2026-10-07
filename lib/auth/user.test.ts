import { expect, it } from "vitest";
import { getDisplayUser } from "./user";

it("usa o nome dos metadados", () =>
  expect(
    getDisplayUser({
      email: "ana@email.com",
      user_metadata: { full_name: "Ana Souza" },
    }),
  ).toEqual({ name: "Ana Souza", email: "ana@email.com" }));

it("sem nome, usa o início do e-mail", () =>
  expect(
    getDisplayUser({ email: "ana@email.com", user_metadata: {} }).name,
  ).toBe("ana"));

it("nome em branco ou não texto cai no e-mail", () => {
  expect(
    getDisplayUser({
      email: "ana@email.com",
      user_metadata: { full_name: "  " },
    }).name,
  ).toBe("ana");
  expect(
    getDisplayUser({ email: "ana@email.com", user_metadata: { full_name: 42 } })
      .name,
  ).toBe("ana");
});

it("sem claims devolve valores neutros", () =>
  expect(getDisplayUser(null)).toEqual({ name: "Usuário", email: "" }));
